import Scratch from "../../utils/scratch.js"
var app = getApp()

Page({
  data: {
    status: 0, // 0: 普通页面 1:有集集乐的情况
    orderId: '',
    franchiseeId: '',
    collectBenefitData: {}, // 集集乐数据
    starData: [], //集集乐的星 light:已集样式 dark:未集样式
    isFail:true,//刮刮乐未中奖
    isWinning:true,//刮刮乐中奖
    isComfort:true,//刮刮乐安慰奖
    isWhole:true,//刮奖区域是否显示
    scratchId: '',//活动号
    isShowteam: false,
    winingTitle:'',
    canShow: wx.canIUse('cover-view'),
    isScroll : true //刮刮乐当在 canvas 中移动时且有绑定手势事件时禁止屏幕滚动以及下拉刷新
  },
  onLoad: function (options) {
    let that = this;

    that.setData({
      'orderId': options.detail,
      'code': options.code
    });
    return false;
    // dont know what todo
    that.getGoldenData(options.detail);
    let systemInfo = app.globalData.systemInfo;
    let width = 558 * systemInfo.windowWidth / 750;
    let height = 258 * systemInfo.windowWidth / 750;
    that.scratch = new Scratch(that, {
      canvasWidth: width,
      canvasHeight: height,
      imageResource: app.getSiteBaseUrl() +'/App/downloadResourceFromUrl&url='+app.getCdnUrl()+'/static/webapp/images/scratchMovie.png',
      maskColor: "red",
      r: 15,
      callback: () => {
        that.setData({
          hideCanvas: true
        })
      },
      imgLoadCallback: () =>{
        setTimeout(function() {
          that.setData({
            isShowteam: true
          });
        }, 150);
      }
    });
  },
  onShareAppMessage: function (res) {
    var that = this;
    return {
      // title: that.data.scratchInfo.title,
      path: '/pages/scratch/scratch?id=' + that.data.scratchId,
      success: function (res) {
        // 转发成功
        app.sendRequest({
          url: "/App/getTime",
          data: {
            app_id: app.globalData.appId,
            activity_id: that.data.scratchId,
            type: 'share'
          },
          success: function (res) {

          }
        })

      },
      fail: function (res) {
        // 转发失败
      }
    }
  },
  // 获取集集乐数据
  getCollectBenefitData: function(id){
    let that = this;
    app.sendRequest({
      url: '/App/collectmeSendCoupon',
      data: {
        'order_id': id,
      },
      hideLoading: true,
      success: function(res){     
        let starData = [];
        for(var i = 0; i < res.data.star_num; i++){
          starData.push('light');
        }
        for(var i = 0; i < res.data.collect_num - res.data.star_num; i++){
          starData.push('dark');
        }
        that.setData({
          'collectBenefitData': res.data,
          'starData': starData
        });
      }
    });
  },
  goToHomepage: function(){
    let router = app.getHomepageRouter();
    app.reLaunch({
      url:'/pages/' + router + '/' + router
    });
  },
  goToOrderDetail: function(){
    let that = this;
    let groupPath = '/pages/groupOrderDetail/groupOrderDetail?id=' + that.data.orderId;
    let pagePath = '/pages/goodsOrderDetail/goodsOrderDetail?detail=' + that.data.orderId;
    let appointmentPath = '/pages/appointmentOrderDetail/appointmentOrderDetail?detail=' + that.data.orderId;
    if(this.data.is_group == 'true'){
      app.turnToPage(groupPath, true);
    }else if(this.data.code){
      app.turnToPage(appointmentPath, true);
    }else{
      app.turnToPage(pagePath, true);
    }
  }
})
