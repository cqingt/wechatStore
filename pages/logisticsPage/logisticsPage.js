
var app = getApp()

Page({
  data: {
    info: {}
  },
  onLoad: function(options){
    var that = this,
        orderId = options.detail;

    app.sendRequest({
      url: '/App/expressFlow',
      data: {
        order_id: orderId
      },
      success: function(res){
        that.setData({
          info: res.data
        })
      }
    })
  }
})
