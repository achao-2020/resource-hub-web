// 全局登录检查混入
import { globalLoginCheck } from '@/utils/auth.js';
import { wxLogin } from '@/utils/wxAuth.js';

// 创建一个标志，用于避免无限递归
const MIXIN_FLAG = Symbol('loginCheckMixin');

export default {
  // 页面数据
  data() {
    return {
      isLoggedIn: false,
      userInfo: null,
      loginChecking: false, // 登录检查状态，防止重复检查
      [MIXIN_FLAG]: true // 添加混入标志
    };
  },
  
  // 页面生命周期
  onLoad(options) {
    // 避免在其他生命周期中重复检查
    if (!this.loginChecking) {
      this.loginChecking = true;
      // 在页面加载时执行登录检查
      this._doLoginCheck().finally(() => {
        this.loginChecking = false;
      });
    }
  },
  
  // 页面显示时再次检查登录状态
  onShow() {
    // 避免在其他生命周期中重复检查
    if (!this.loginChecking) {
      this.loginChecking = true;
      // 页面显示时也检查一下登录状态
      this._doLoginCheck().finally(() => {
        this.loginChecking = false;
      });
    }
  },
  
  // 方法
  methods: {
    /**
     * 实际执行登录检查的内部方法
     */
    async _doLoginCheck() {
	console.log('开始微信登录检查')
      try {
        // 调用全局登录检查
        const { isLoggedIn, userInfo } = await globalLoginCheck();
        
        console.log('loginCheck获取的登录状态:', isLoggedIn)
        console.log('loginCheck获取的用户信息:', userInfo)
        
        this.isLoggedIn = isLoggedIn;
        this.userInfo = userInfo;
        
        // 如果未登录，显示授权提示
        if (!isLoggedIn) {
          console.log('用户未登录，执行微信授权流程')
          // 调用微信登录流程
          const loginResult = await wxLogin();
          
          // 更新登录状态
          this.isLoggedIn = loginResult.success;
          this.userInfo = loginResult.userInfo;
          
          // 触发登录状态变化事件
          this.$emit('loginStatusChange', {
            isLoggedIn: loginResult.success,
            userInfo: loginResult.userInfo
          });
          
          // 如果页面有登录成功或失败的回调方法，调用它们
          if (loginResult.success && this.onLoginSuccess && typeof this.onLoginSuccess === 'function') {
            this.onLoginSuccess(loginResult.userInfo);
          } else if (!loginResult.success && this.onLoginFail && typeof this.onLoginFail === 'function') {
            this.onLoginFail(loginResult.message);
          }
        }
      } catch (error) {
        console.error('登录检查失败:', error);
        this.isLoggedIn = false;
        this.userInfo = null;
      }
    },
    
    /**
     * 手动触发登录
     * 可以在页面中调用此方法主动触发登录流程
     */
    async triggerLogin() {
      if (this.loginChecking) return { success: false, message: '正在登录中...' };
      
      this.loginChecking = true;
      try {
        const loginResult = await wxLogin();
        
        this.isLoggedIn = loginResult.success;
        this.userInfo = loginResult.userInfo;
        
        this.$emit('loginStatusChange', {
          isLoggedIn: loginResult.success,
          userInfo: loginResult.userInfo
        });
        
        if (loginResult.success && this.onLoginSuccess && typeof this.onLoginSuccess === 'function') {
          this.onLoginSuccess(loginResult.userInfo);
        } else if (!loginResult.success && this.onLoginFail && typeof this.onLoginFail === 'function') {
          this.onLoginFail(loginResult.message);
        }
        
        return loginResult;
      } catch (error) {
        console.error('手动登录失败:', error);
        return { success: false, message: '登录失败' };
      } finally {
        this.loginChecking = false;
      }
    },
    
    /**
     * 获取当前用户信息
     */
    getCurrentUserInfo() {
      return this.userInfo;
    },
    
    /**
     * 判断用户是否已登录
     */
    hasLoggedIn() {
      return this.isLoggedIn;
    }
  }
}