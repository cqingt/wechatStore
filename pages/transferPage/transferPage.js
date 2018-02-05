
var app = getApp()

Page({
  data: {
    discountList: [],
    appTitle: '',
    balance: '',
    useBalance: false,
    totalPayment: '',
    inputPrice: '',
    selectDiscountInfo: {},
    selectDiscountIndex: 0,
    discount_cut_price: '',
    requesting: false
  },
  inputTimeout: '',
  remark: '',
  onLoad: function(){
    var _this = this;
    this.setData({
      appTitle: app.getAppTitle()
    })
  },
  inputPrice: function(e){
    var _this = this,
        price = e.detail.value;

    this.setData({
      selectDiscountInfo: '',
      totalPayment: price,
      inputPrice: price
    })
    this.inputTimeout && clearTimeout(this.inputTimeout);

    if ( +price === 0 ) {
      return;
    }
    this.inputTimeout = setTimeout(function(){
      _this.calculateTotalPrice();
    }, 800)
  },
  confirmPay: function(){
    var _this = this,
        inputPrice = this.data.inputPrice,
        totalPayment = this.data.totalPayment,
        benefits = this.data.selectDiscountInfo;

    if(isNaN(inputPrice) || (+inputPrice).toFixed(2) <= 0){
      app.showModal({
        content: '请输入正确的金额'
      });
      return;
    }
    if(isNaN(totalPayment) || totalPayment < 0){
      alertTip('error payment amount');
      return;
    }

    if(this.data.requesting){
      return;
    }
    this.setData({
      requesting: true
    });

    if(benefits.no_use_benefit == 1){
      benefits = '';
    }

    app.sendRequest({
      url: '/index.php?r=AppShop/createTransferOrder',
      method: 'post',
      data: {
        price: inputPrice,
        check_price: totalPayment,
        message: this.remark,
        selected_benefit: benefits,
        is_balance: this.data.useBalance == true ? 1 : 0
      },
      success: function(res){
        var orderId = res.data;
        _this.payOrder(orderId);
      },
      complete: function(){
        _this.setData({
          requesting: false
        });
      }
    })
  },
  payOrder: function(orderId){
    var _this = this;

    function paySuccess() {
      var pagePath = '/pages/transferPaySuccess/transferPaySuccess?detail=' + orderId;

      app.turnToPage(pagePath, 1);
    }

    function payFail(){
      app.turnToPage('/pages/transferOrderDetail/transferOrderDetail?detail=' + orderId, 1);
    }

    if(this.data.totalPayment == 0){
      app.sendRequest({
        url: '/index.php?r=AppShop/paygoods',
        data: {
          order_id: orderId,
          total_price: 0
        },
        success: function(res){
          paySuccess();
        },
        fail: function(){
          payFail();
        },
        complete: function(){
          _this.setData({
            requesting: false
          })
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
        var param = res.data;

        param.orderId = orderId;
        param.goodsType = 5;
        param.success = paySuccess;
        param.fail = payFail;
        app.wxPay(param);
      },
      complete: function(){
        _this.setData({
          requesting: false
        })
      }
    })
  },
  discountChange: function(e){
    var index = +e.detail.value;

    this.setData({
      selectDiscountInfo: this.data.discountList[index],
      selectDiscountIndex: index,
    })
    this.calculateTotalPrice();
  },
  calculateTotalPrice: function(){
    var _this = this,
        selectDiscountInfo = this.data.selectDiscountInfo,
        price = +this.data.inputPrice;

    app.sendRequest({
      hideLoading: true,
      url: '/index.php?r=AppShop/calculationPrice',
      method: 'post',
      data: {
        price: price,
        selected_benefit: selectDiscountInfo,
        is_balance: this.data.useBalance == true ? 1 : 0
      },
      success: function(res){
        var data = res.data,
            benefits = data.can_use_benefit.data,
            selected_benefit, selectDiscountIndex;

        if(benefits.length){
          benefits.unshift({
            title: '不使用优惠',
            name: '无',
            no_use_benefit: 1
          });
        }

        if(selectDiscountInfo.no_use_benefit == 1){
          selectDiscountIndex = 0;
          selected_benefit = selectDiscountInfo;
        } else {
          selected_benefit = data.selected_benefit_info;
          for (var i = 0; i <= benefits.length - 1; i++) {
            var select_discount_type = selected_benefit.discount_type;

            if(select_discount_type === benefits[i].discount_type){
              if(select_discount_type === 'coupon'){
                if(benefits[i].coupon_id == selected_benefit.coupon_id){
                  selectDiscountIndex = i;
                  break;
                }
              } else {
                selectDiscountIndex = i;
                break;
              }
            }
          }
        }

        _this.setData({
          totalPayment: data.price,
          discountList: benefits,
          selectDiscountInfo: selected_benefit,
          selectDiscountIndex: selectDiscountIndex,
          balance: data.balance,
          use_balance_count: data.use_balance,
          discount_cut_price: data.discount_cut_price
        });
      }
    })
  },
  inputRemark: function(e){
    this.remark = e.detail.value;
  },
  ifUseBalance: function(e){
    this.setData({
      useBalance: e.detail.value
    })
    this.calculateTotalPrice();
  }

})
