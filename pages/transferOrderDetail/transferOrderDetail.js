
var app = getApp()

Page({
  data: {
    orderInfo: {},
    orderStatus: { '0':'待付款', '6':'已完成', '7':'已关闭'},
    isFromBack: false,
    isFromTemplateMsg: false,
    orderId: '',
    discountList: []
  },
  onLoad: function (options) {
    this.setData({
      orderId: options.detail,
      isFromTemplateMsg: options.from === 'template_msg' ? true : false,
      franchiseeId: options.franchisee || ''
    })
    this.dataInitial();
  },
  // 每个页面数据初始化函数 dataInitial
  dataInitial: function () {
    this.getOrderDetail(this.data.orderId);
  },
  onShow: function () {
    if(this.data.isFromBack){
      if (!!this.data.orderId) {
        this.getOrderDetail(this.data.orderId, 1);
      }
    } else {
      this.setData({
        isFromBack: true
      })
    }
  },
  getOrderDetail: function (orderId, isFromAddrSelect) {
    var that = this;
    app.getOrderDetail({
      data: {
        order_id: orderId,
        sub_shop_app_id: this.data.franchiseeId
      },
      success: function (res) {
        var form_data = res.data[0].form_data,
            address_id = '';

        that.setData({
          orderInfo: form_data,
          discountList: form_data.can_use_benefit.data,
          index: form_data.can_use_benefit.selected_index,
        })
      }
    })
  },
  cancelOrder: function (e) {
    var orderId = this.data.orderId,
        that = this;

    app.showModal({
      content: '是否取消订单？',
      showCancel: true,
      confirmText: '是',
      cancelText: '否',
      confirm: function () {
        app.sendRequest({
          url: '/index.php?r=AppShop/cancelOrder',
          data: {
            order_id: orderId,
            sub_shop_app_id: that.data.franchiseeId
          },
          success: function (res) {
            var data = {};

            data['orderInfo.status'] = 7;
            that.setData(data);
          }
        })
      }
    })
  },
  payOrder: function (e) {
    var that = this,
        orderId = this.data.orderId;

    if (this.data.orderInfo.total_price == 0) {
      app.sendRequest({
        url: '/index.php?r=AppShop/paygoods',
        data: {
          order_id: orderId,
          total_price: 0
        },
        success: function(res){
          that.getOrderDetail(that.data.orderId);
        }
      });
      return;
    }

    app.sendRequest({
      url: '/index.php?r=AppShop/GetWxWebappPaymentCode',
      data: {
        order_id: orderId
      },
      success: function (res) {
        var param = res.data,
            orderId = that.data.orderId;

        param.orderId = orderId;
        param.goodsType = that.data.orderInfo.goods_type;
        param.success = function () {
          setTimeout(function(){
            that.getOrderDetail(orderId);
          }, 1500);
        };
        app.wxPay(param);
      }
    })
  },
  goToHomepage: function () {
    var router = app.getHomepageRouter();
    app.turnToPage('/pages/' + router + '/' + router, true);
  },
  changeDiscount: function (e) {
    var _this = this;
    var index = _this.data.orderInfo.can_use_benefit.selected_index;
    var value = parseInt(e.detail.value);

    this.setData({
      index: value
    });

    var discount_type = _this.data.orderInfo.can_use_benefit.data[value].discount_type,
        coupon_id = _this.data.orderInfo.can_use_benefit.data[value].coupon_id;

    app.sendRequest({
      url: '/index.php?r=AppShop/ChangeOrder',
      data: {
        app_id: app.getAppId(),
        order_id: _this.data.orderId,
        discount_type: discount_type,
        coupon_id: coupon_id,
        sub_shop_app_id: _this.data.franchiseeId
      },
      success: function (res) {
        //console.log(res);
        _this.getOrderDetail(_this.data.orderId);
      }
    });
  },
  verificationCode: function() {
    app.turnToPage('/pages/verificationCodePage/verificationCodePage?detail=' + this.data.orderId + '&sub_shop_app_id=' + this.data.franchiseeId);
  }
})
