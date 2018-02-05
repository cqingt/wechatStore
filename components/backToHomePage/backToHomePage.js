var app = getApp();
Component({
  properties: {
    backToHomePage: {
      type: Object,
      value: {
        showButton: false,
        showTip: true
      }
    }
  },
  data: {
    backToHomePage: {
      showButton: true,
      showTip: true
    }
  },
  methods: {
    backToHomePage:function() {
      app.turnToPage('/pages/' + app.globalData.homepageRouter + '/' + app.globalData.homepageRouter)
    },
    closeTip:function(){
      this.setData({
        'backToHomePage.showTip': false
      })
    }
  }
})