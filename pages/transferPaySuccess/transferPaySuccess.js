
var app = getApp()

Page({
  data: {
    totalPayment: ''
  },
  orderId: '',
  onLoad: function (options) {
    this.orderId = options.detail || '';
    this.getOrderDetail();
    this.getGoldenData(options.detail);
  },
 
  getGoldenData: function (id) {
    let that = this;
    app.sendRequest({
      url: "/index.php?r=appLotteryActivity/getTimeAfterConsume",
      method: "post",
      data: {
        app_id: app.globalData.appId,
        order_id: id
      },
      success: function (data) {

      }
    })
  },
  getOrderDetail: function(){
    var that = this;
    app.getOrderDetail({
      data: {
        order_id: this.orderId
      },
      success: function (res) {
        that.setData({
          totalPayment: res.data[0].form_data.total_price
        })
      }
    })
  },
  transferSuccessCallback: function(){
    app.turnBack();
  },
  goToOrderDetail: function(){
    app.turnToPage('/pages/transferOrderDetail/transferOrderDetail?detail='+this.orderId, 1);
  }
})
