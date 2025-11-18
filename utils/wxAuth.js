// 微信小程序用户授权管理
import { saveUserInfo } from './auth.js';

/**
 * 检查用户是否已授权获取用户信息
 * @returns {Promise<boolean>} 是否已授权
 */
export function checkUserInfoAuth() {
  return new Promise((resolve) => {
    uni.getSetting({
      success: (res) => {
        resolve(!!res.authSetting['scope.userInfo']);
      },
      fail: (error) => {
        console.error('检查用户授权状态失败:', error);
        resolve(false);
      }
    });
  });
}

/**
 * 获取微信用户信息
 * 打开授权弹窗让用户选择是否允许获取信息
 * @returns {Promise<Object|null>} 用户信息或null
 */
export function getUserProfile() {
  return new Promise((resolve, reject) => {
    console.log('开始调用getUserProfile获取用户信息');
    // 优先使用 getUserProfile 方法（微信推荐的方式）
    uni.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        const userInfo = res.userInfo;
        console.log('获取用户信息成功:', userInfo);
        // 保存用户信息到本地缓存
        console.log('准备保存用户信息到本地缓存');
        saveUserInfo(userInfo).then(() => {
          console.log('用户信息保存成功');
          resolve(userInfo);
        }).catch(() => {
          console.log('用户信息保存失败，但仍返回用户信息');
          resolve(userInfo); // 即使保存失败也返回用户信息
        });
      },
      fail: (error) => {
        console.error('获取用户信息失败:', error);
        // 如果是用户拒绝授权，返回null
        if (error.errMsg.indexOf('auth deny') >= 0 || error.errMsg.indexOf('cancel') >= 0) {
          resolve(null);
        } else {
          // 其他错误情况尝试使用旧的方式
          tryOldGetUserInfo().then(resolve).catch(reject);
        }
      }
    });
  });
}

/**
 * 使用旧的获取用户信息方式（兼容处理）
 * @returns {Promise<Object|null>} 用户信息或null
 */
function tryOldGetUserInfo() {
  return new Promise((resolve, reject) => {
    checkUserInfoAuth().then((hasAuth) => {
      if (hasAuth) {
        console.log('开始调用旧版getUserInfo获取用户信息');
        // 如果已经授权，直接获取用户信息
        uni.getUserInfo({
          success: (res) => {
            const userInfo = res.userInfo;
            console.log('旧版getUserInfo调用成功，获取到用户信息:', userInfo);
            console.log('准备保存用户信息到本地缓存');
            saveUserInfo(userInfo).then(() => {
              console.log('用户信息保存成功');
              resolve(userInfo);
            }).catch(() => {
              console.log('用户信息保存失败，但仍返回用户信息');
              resolve(userInfo);
            });
          },
          fail: (error) => {
            console.error('使用旧方式获取用户信息失败:', error);
            reject(error);
          }
        });
      } else {
        // 未授权，需要用户手动触发授权按钮
        console.log('请引导用户点击授权按钮');
        resolve(null);
      }
    });
  });
}

/**
 * 显示用户授权弹窗
 * 在用户未登录时调用此方法
 * @returns {Promise<Object|null>} 用户信息或null
 */
export function showAuthModal() {
  return new Promise((resolve) => {
    uni.showModal({
      title: '授权提示',
      content: '需要获取您的微信信息以提供更好的服务',
      showCancel: true,
      cancelText: '暂不授权',
      confirmText: '立即授权',
      success: async (res) => {
        if (res.confirm) {
          // 用户点击了确认，尝试获取用户信息
          try {
            const userInfo = await getUserProfile();
            resolve(userInfo);
          } catch (error) {
            console.error('授权过程出错:', error);
            resolve(null);
          }
        } else {
          // 用户点击了取消
          resolve(null);
        }
      },
      fail: (error) => {
        console.error('显示授权弹窗失败:', error);
        resolve(null);
      }
    });
  });
}

/**
 * 完整的微信登录流程
 * @returns {Promise<Object>} 登录结果
 */
export async function wxLogin() {
	console.log('开始微信登录流程')
  try {
    // 1. 检查是否已经授权
    const hasAuth = await checkUserInfoAuth();
    
    if (hasAuth) {
      // 2. 已授权，直接获取用户信息
      const userInfo = await getUserProfile();
      return {
        success: !!userInfo,
        userInfo,
        message: userInfo ? '登录成功' : '获取用户信息失败'
      };
    } else {
	  console.log('未授权，显示授权弹窗')
      // 3. 未授权，显示授权弹窗
      const userInfo = await showAuthModal();
      return {
        success: !!userInfo,
        userInfo,
        message: userInfo ? '授权成功并登录' : '用户取消授权'
      };
    }
  } catch (error) {
    console.error('微信登录流程出错:', error);
    return {
      success: false,
      userInfo: null,
      message: '登录过程发生错误'
    };
  }
}