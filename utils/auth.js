// 登录状态和用户信息管理工具类
const USER_INFO_KEY = 'userInfo';

/**
 * 检查用户是否已登录
 * @returns {Promise<boolean>} 是否已登录
 */
export function checkLogin() {
  return new Promise((resolve) => {
    try {
      console.log('checkLogin函数被调用');
      const userInfo = uni.getStorageSync(USER_INFO_KEY);
      console.log('检查登录状态获取到的userInfo:', userInfo);
      console.log('登录状态判断结果:', !!userInfo && userInfo !== null && typeof userInfo === 'object');
      resolve(!!userInfo && userInfo !== null && typeof userInfo === 'object');
    } catch (error) {
      console.error('检查登录状态失败:', error);
      resolve(false);
    }
  });
}

/**
 * 获取当前用户信息
 * @returns {Promise<Object|null>} 用户信息对象或null
 */
export function getUserInfo() {
  return new Promise((resolve) => {
    try {
      const userInfo = uni.getStorageSync(USER_INFO_KEY);
	  console.log('从USER_INFO_KEY中获取到的userInfo')
	  console.log(userInfo)
      resolve(userInfo || null);
    } catch (error) {
      console.error('获取用户信息失败:', error);
      resolve(null);
    }
  });
}

/**
 * 保存用户信息到本地缓存
 * @param {Object} userInfo 用户信息对象
 * @returns {Promise<boolean>} 是否保存成功
 */
export function saveUserInfo(userInfo) {
  return new Promise((resolve, reject) => {
    try {
      console.log('saveUserInfo函数被调用')
      console.log('用户信息参数:', userInfo)
      console.log('开始往USER_INFO_KEY写入当前登录用户')
      uni.setStorageSync(USER_INFO_KEY, userInfo);
      console.log('完成写入当前登录用户')
      // 验证保存是否成功
      const savedInfo = uni.getStorageSync(USER_INFO_KEY)
      console.log('保存验证结果:', savedInfo ? '保存成功' : '保存失败')
      resolve(true);
    } catch (error) {
      console.error('保存用户信息失败:', error);
      reject(error);
    }
  });
}

/**
 * 清除用户登录信息
 * @returns {Promise<boolean>} 是否清除成功
 */
export function clearUserInfo() {
  return new Promise((resolve, reject) => {
    try {
      console.log('clearUserInfo函数被调用，准备清除用户信息')
      uni.removeStorageSync(USER_INFO_KEY);
      console.log('用户信息已从本地缓存中清除')
      // 验证清除是否成功
      const remainingInfo = uni.getStorageSync(USER_INFO_KEY);
      console.log('清除后验证结果:', remainingInfo ? '清除失败' : '清除成功')
      resolve(true);
    } catch (error) {
      console.error('清除用户信息失败:', error);
      reject(error);
    }
  });
}

/**
 * 全局登录检查方法
 * 在每个页面进入时调用此方法检查登录状态
 * @returns {Promise<Object>} 包含是否登录和用户信息的对象
 */
export async function globalLoginCheck() {
  console.log('globalLoginCheck方法执行')
  const isLoggedIn = await checkLogin();
  console.log('登录检查结果:', isLoggedIn)
  if (isLoggedIn) {
	console.log('当前已登录，开始获取用户信息')
    const userInfo = await getUserInfo();
    return { isLoggedIn: true, userInfo };
  }
  return { isLoggedIn: false, userInfo: null };
}