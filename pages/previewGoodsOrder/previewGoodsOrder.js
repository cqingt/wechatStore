
var app = getApp()
var util = require('../../utils/util.js')

Page({
  data: {
    goodsList: [],
    selectAddress: {},
    discountList: [],
    selectDiscountInfo: {},
    selectDiscountIndex: '',
    orderRemark: '',
    is_self_delivery: 0,
    express_fee: '',
    balance: '',
    useBalance: true,
    deduction: '',
    discount_cut_price: '',
    original_price: '',
    totalPayment: '',
    shopAddress: '',
    noAdditionalInfo: true,
    is_group:'',
    exchangeCouponData: {
      dialogHidden: true,
      goodsInfo: {},
      selectModelInfo: {},
      hasSelectGoods: false,
      voucher_coupon_goods_info: {}
    }
  },
  isFromSelectAddress: false,
  franchisee_id: '',
  cart_id_arr: [],
  cart_data_arr: [],
  requesting: false,
  additional_info: {},
  is_group:'',
  inputTimer: '',
  onLoad: function (options) {
    this.franchisee_id = options.franchisee || '';
    this.cart_id_arr = options.cart_arr ? decodeURIComponent(options.cart_arr).split(',') : [];
    this.dataInitial();
    this.is_group = options.is_group;
    this.setData({ is_group: options.is_group});
  },
  dataInitial: function () {
    this.getCalculationInfo();
    this.getShopAddress();
    this.getCartList();
  },
  onShow: function(){
    if(this.isFromSelectAddress){
      this.getCalculationInfo();
      this.isFromSelectAddress = false;
    }
  },
  getCartList: function () {
    var that = this,
        franchisee_id = this.franchisee_id;

    app.sendRequest({
      url: '/index.php?r=AppShop/cartList',
      data: {
        page: 1,
        page_size: 100,
        sub_shop_app_id: franchisee_id,
        parent_shop_app_id: franchisee_id ? app.globalData.appId : ''
      },
      success: function(res){
        var data = [];
        if(that.cart_id_arr.length){
          for (var i = 0; i <= res.data.length - 1; i++) {
            if(that.cart_id_arr.indexOf(res.data[i].id) >= 0){
              data.push(res.data[i]);
            }
          }
        } else {
          data = res.data;
        }

        for (var i = 0; i <= data.length - 1; i++) {
          var goods = data[i],
              modelArr = goods.model_value;
          goods.model_value_str = modelArr && modelArr.join ? '('+modelArr.join('|')+')' : '';
          that.cart_data_arr.push({
            cart_id: goods.id,
            goods_id: goods.goods_id,
            model_id: goods.model_id,
            num: goods.num
          });
        }
        that.setData({
          goodsList: data
        });
      }
    })
  },
  getCalculationInfo: function(){
    var _this = this;

    app.sendRequest({
      url: '/index.php?r=AppShop/calculationPrice',
      method: 'post',
      data: {
        sub_shop_app_id: this.franchisee_id,
        address_id: this.data.selectAddress.id,
        cart_id_arr: this.cart_id_arr,
        is_balance: this.data.useBalance ? 1 : 0,
        is_self_delivery: this.data.is_self_delivery,
        selected_benefit: this.data.selectDiscountInfo,
        voucher_coupon_goods_info: this.data.exchangeCouponData.voucher_coupon_goods_info
      },
      success: function(res){
        var info = res.data,
            benefits = info.can_use_benefit.data,
            goods_info = info.goods_info,
            additional_info_goods = [],
            additional_goodsid_arr = [],
            selectDiscountIndex,
            selectDiscountInfo;

        if(benefits.length){
          benefits.unshift({
            title: '不使用优惠',
            name: '无',
            no_use_benefit: 1
          });
        }

        if(_this.data.selectDiscountInfo && _this.data.selectDiscountInfo.no_use_benefit == 1){
          selectDiscountInfo = _this.data.selectDiscountInfo;
          selectDiscountIndex = 0;
        } else {
          selectDiscountInfo = info.selected_benefit_info;
          if(selectDiscountInfo && selectDiscountInfo.discount_type){
            for (var i = 0; i <= benefits.length - 1; i++) {
              if(selectDiscountInfo.discount_type === benefits[i].discount_type){
                if(selectDiscountInfo.discount_type === 'coupon') {
                  if(selectDiscountInfo.coupon_id === benefits[i].coupon_id){
                    selectDiscountIndex = i;
                    break;
                  }
                } else {
                  selectDiscountIndex = i;
                  break;
                }
              }
            }
            // 优惠券：兑换券操作
            if(selectDiscountInfo.discount_type == 'coupon' && selectDiscountInfo.type == 3 && _this.data.exchangeCouponData.hasSelectGoods == false ){
              _this.exchangeCouponInit(parseInt(selectDiscountInfo.value));
            }
          }
        }

        for (var i = 0; i <= goods_info.length - 1; i++) {
          if(goods_info[i].delivery_id && goods_info[i].delivery_id != 0 && additional_goodsid_arr.indexOf(goods_info[i].id) == -1){
            additional_goodsid_arr.push(goods_info[i].id);
            additional_info_goods.push(goods_info[i]);
          }
        }
        _this.setData({
          selectAddress: info.address,
          discountList: benefits,
          selectDiscountIndex: selectDiscountIndex,
          selectDiscountInfo: selectDiscountInfo,
          express_fee: info.express_fee,
          discount_cut_price: info.discount_cut_price,
          balance: info.balance,
          deduction: info.use_balance,
          original_price: info.original_price,
          totalPayment: info.price,
          noAdditionalInfo: additional_info_goods.length ? false : true
        })
        app.setPreviewGoodsInfo(additional_info_goods);
      }
    });
  },
  getShopAddress:function(){
    var that = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/getAppShopLocationInfo',
      success: function (res) {
        that.setData({
          shopAddress: res.data
        });
      }
    });
  },
  remarkInput: function (e) {
    var value = e.detail.value;
    if(value.length  > 30){
      app.showModal({
        content: '最多只能输入30个字'
      });
      value = value.slice(0, 30);
    }

    this.setData({
      orderRemark: value
    });
  },
  previewImage: function (e) {
    app.previewImage({
      current: e.currentTarget.dataset.src
    });
  },
  clickMinusButton: function(e){
    var index = e.currentTarget.dataset.index,
        goods = this.data.goodsList[index];
    if(+goods.num <= 0) return;
    this.changeGoodsNum(index, 'minus');
  },
  clickPlusButton: function(e){
    var index = e.currentTarget.dataset.index;
    this.changeGoodsNum(index, 'plus');
  },
  changeGoodsNum: function(index, type){
    var goods = this.data.goodsList[index],
        currentNum = +goods.num,
        targetNum = type == 'plus' ? currentNum + 1 : (type == 'minus' ? currentNum - 1 : Number(type)),
        that = this,
        data = {},
        param;

    if(targetNum == 0 && type == 'minus'){
      app.showModal({
        content: '确定从购物车删除该商品？',
        showCancel: true,
        confirm: function(){
          that.cart_data_arr[index].num = targetNum;
          data['goodsList['+index+'].num'] = targetNum;
          that.setData(data);
          that.deleteGoods(index);
        }
      })
      return;
    }

    param = {
      goods_id: goods.goods_id,
      model_id: goods.model_id || '',
      num: targetNum,
      sub_shop_app_id: that.franchisee_id,
      is_seckill : goods.is_seckill == 1 ? 1 : ''
    };
    app.sendRequest({
      hideLoading: true,
      url: '/index.php?r=AppShop/addCart',
      data: param,
      success: function(res){
        that.cart_data_arr[index].num = targetNum;
        data['goodsList['+index+'].num'] = targetNum;
        data.selectDiscountInfo = '';
        that.setData(data);
        that.getCalculationInfo();
      },
      fail: function(res){
        data = {};
        that.cart_data_arr[index].num = currentNum;
        data['goodsList['+index+'].num'] = currentNum;
        that.setData(data);
      }
    })
  },
  deleteGoods: function(index){
    var goodsList = this.data.goodsList,
        that = this,
        listExcludeDelete;

    app.sendRequest({
      url : '/index.php?r=AppShop/deleteCart',
      method: 'post',
      data: {
        cart_id_arr: [this.cart_data_arr[index].cart_id],
        sub_shop_app_id: this.franchisee_id
      },
      success: function(res){
        (listExcludeDelete = goodsList.concat([])).splice(index, 1);
        if(listExcludeDelete.length == 0){
          app.turnBack();
          return;
        }

        var deleteGoodsId = goodsList[index],
            noSameGoodsId = true;

        for (var i = listExcludeDelete.length - 1; i >= 0; i--) {
          if(listExcludeDelete[i].id == deleteGoodsId){
            noSameGoodsId = false;
            break;
          }
        }
        if(noSameGoodsId){
          delete that.additional_info[deleteGoodsId];
        }
        that.cart_data_arr.splice(index, 1);
        that.setData({
          goodsList: listExcludeDelete,
          selectDiscountInfo: '',
          exchangeCouponData: {
            dialogHidden: true,
            hasSelectGoods: false,
            voucher_coupon_goods_info: {}
          }
        })
        that.getCalculationInfo();
      }
    });
  },
  confirmPayment: function(e){
    var list = this.data.goodsList,
        that = this,
        selected_benefit = this.data.selectDiscountInfo,
        hasWritedAdditionalInfo = false;

    if(this.data.is_self_delivery == 0 && !this.data.selectAddress.id){
      app.showModal({
        content: '请选择地址'
      });
      return;
    }

    for(var key in this.additional_info){
      if(key !== undefined){
        hasWritedAdditionalInfo = true;
        break;
      }
    }
    if(!this.data.noAdditionalInfo && !hasWritedAdditionalInfo){
      app.showModal({
        content: '请填写商品补充信息'
      });
      return;
    }

    if(this.requesting){
      return;
    }
    this.requesting = true;

    app.sendRequest({
      url : '/index.php?r=AppShop/addCartOrder',
      method: 'post',
      data: {
        cart_arr: this.cart_data_arr,
        formId: e.detail.formId,
        sub_shop_app_id: this.franchisee_id,
        selected_benefit: selected_benefit,
        is_balance: this.data.useBalance ? 1 : 0,
        is_self_delivery: this.data.is_self_delivery,
        remark: this.data.orderRemark,
        address_id: this.data.selectAddress.id,
        additional_info: this.additional_info,
        voucher_coupon_goods_info: this.data.exchangeCouponData.voucher_coupon_goods_info
      },
      success: function(res){
        that.payOrder(res.data);
      },
      fail: function(){
        that.requesting = false;
      },
      successStatusAbnormal: function(){
        that.requesting = false;
      }
    });
  },
  payOrder: function(orderId){
    var that = this;

    function paySuccess() {
      var pagePath = '/pages/goodsOrderPaySuccess/goodsOrderPaySuccess?detail=' + orderId + (that.franchisee_id ? '&franchisee='+that.franchisee_id : '') + '&is_group=' + !!that.is_group;
      if(!that.franchisee_id){
        app.sendRequest({
          url: '/index.php?r=AppMarketing/CheckAppCollectmeStatus',
          data: {
            'order_id': orderId
          },
          success: function(res){
            if(res.valid == 0) {
              pagePath += '&collectBenefit=1';
            }
            app.turnToPage(pagePath, 1);
          }
        });
      } else {
        app.turnToPage(pagePath, 1);
      }
    }

    function payFail(){
      if(that.is_group){
        app.turnToPage('/pages/groupOrderDetail/groupOrderDetail?id=' + orderId, 1);
      }else{
        app.turnToPage('/pages/goodsOrderDetail/goodsOrderDetail?detail=' + orderId, 1);
      }
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
        successStatusAbnormal: function () {
          payFail();
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
        param.success = paySuccess;
        param.goodsType = 0;
        param.fail = payFail;
        that.wxPay(param);
      },
      fail: function(){
        payFail();
      },
      successStatusAbnormal: function () {
        payFail();
      }
    })
  },
  wxPay: function(param){
    var that = this;
    wx.requestPayment({
      'timeStamp': param.timeStamp,
      'nonceStr': param.nonceStr,
      'package': param.package,
      'signType': 'MD5',
      'paySign': param.paySign,
      success: function(res){
        app.wxPaySuccess(param);
        param.success();
      },
      fail: function(res){
        if(res.errMsg === 'requestPayment:fail cancel'){
          param.fail();
          return;
        }
        app.showModal({
          content: '支付失败',
          complete: param.fail
        })
        app.wxPayFail(param, res.errMsg);
      }
    })
  },
  discountChange: function(e){
    var index = e.detail.value;

    this.setData({
      selectDiscountInfo: this.data.discountList[index],
      selectDiscountIndex: index,
      'exchangeCouponData.hasSelectGoods': false,
      'exchangeCouponData.voucher_coupon_goods_info': {}
    })
    this.getCalculationInfo();
  },
  goToMyAddress: function () {
    var addressId = this.data.selectAddress.id;
    this.isFromSelectAddress = true;
    app.turnToPage('/pages/myAddress/myAddress?id=' + addressId);
  },
  showAddAddress: function () {
    var _this = this;

    app.chooseAddress({
      success: function (res) {
        app.sendRequest({
          method: 'post',
          url: '/index.php?r=AppShop/AddWxAddress',
          data: {
            detailInfo: res.detailInfo || '',
            cityName: res.cityName || '',
            provinceName: res.provinceName || '',
            UserName: res.userName || '',
            telNumber: res.telNumber || '',
            district: res.district || '',
            countyName: res.countyName || ''
          },
          success: function () {
            _this.dataInitial();
          },
        })
      }
    })
  },
  makeStorePhoneCall: function(){
    app.makePhoneCall(this.data.shopAddress.shop_contact);
  },
  openStoreLocation: function(){
    var infor = this.data.shopAddress.region_string + this.data.shopAddress.shop_location;

    infor = infor.replace(/\s/g,'');
    app.sendRequest({
      url: '/index.php?r=Map/GetLatAndLngByAreaInfo',
      data: {
        location_info: infor
      },
      success: function (res) {
        if (res.result){
          wx.openLocation({
            latitude: res.result.location.lat,
            longitude: res.result.location.lng
          })
        }
      }
    });
  },
  useBalanceChange: function(e){
    this.setData({
      useBalance: e.detail.value
    });
    this.getCalculationInfo();
  },
  deliveryWayChange: function(e){
    this.setData({
      is_self_delivery: e.detail.value
    })
    this.getCalculationInfo();
  },
  goToAdditionalInfo: function(){
    app.setGoodsAdditionalInfo(this.additional_info);
    app.turnToPage('/pages/goodsAdditionalInfo/goodsAdditionalInfo');
  },
  exchangeCouponInit: function(id){
    var _this = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/getGoods',
      data: {
        data_id: id
      },
      success: function (res) {
        var goods = res.data[0].form_data;
        var goodsModel = [];
        var selectModelInfo = {
          'models': [],
          'price': 0,
          'modelId': '',
          'models_text': '',
          'imgurl': ''
        };
        if(goods.model_items.length){
          // 有规格
          selectModelInfo['price'] = Number(goods.model_items[0].price);
          selectModelInfo['imgurl'] = goods.model_items[0].img_url;
          selectModelInfo['modelId'] = goods.model_items[0].id;
        } else {
          selectModelInfo['price'] = Number(goods.price);
          selectModelInfo['imgurl'] = goods.cover;
        }
        for(var key in goods.model){
          if(key){
            goodsModel.push(goods.model[key]); // 转成数组
            selectModelInfo['models'].push(goods.model[key].subModelId[0]);
            selectModelInfo['models_text'] += '“' + goods.model[key].subModelName[0] + '” ';
          }
        }
        goods.model = goodsModel; // 将原来的结构转换成数组
        _this.setData({
          'exchangeCouponData.dialogHidden': false, // 显示模态框
          'exchangeCouponData.goodsInfo': goods,
          'exchangeCouponData.selectModelInfo': selectModelInfo
        });
      }
    });
  },
  exchangeCouponHideDialog: function(){
    this.setData({
      selectDiscountInfo: this.data.discountList[0],
      selectDiscountIndex: 0,
      'exchangeCouponData.dialogHidden': true,
      'exchangeCouponData.hasSelectGoods': false,
      'exchangeCouponData.voucher_coupon_goods_info': {}
    })
    this.getCalculationInfo();
  },
  exchangeCouponSelectSubModel: function(e){
    var dataset = e.target.dataset,
        modelIndex = dataset.modelIndex,
        submodelIndex = dataset.submodelIndex,
        data = {},
        selectModels = this.data.exchangeCouponData.selectModelInfo.models,
        model = this.data.exchangeCouponData.goodsInfo.model,
        text = '';

    selectModels[modelIndex] = model[modelIndex].subModelId[submodelIndex];

    // 拼已选中规格文字
    for (let i = 0; i < selectModels.length; i++) {
      let selectSubModelId = model[i].subModelId;
      for (let j = 0; j < selectSubModelId.length; j++) {
        if( selectModels[i] == selectSubModelId[j] ){
          text += '“' + model[i].subModelName[j] + '” ';
        }
      }
    }
    data['exchangeCouponData.selectModelInfo.models'] = selectModels;
    data['exchangeCouponData.selectModelInfo.models_text'] = text;

    this.setData(data);
    this.exchangeCouponResetSelectCountPrice();
  },
  exchangeCouponResetSelectCountPrice: function(){
    var _this = this,
        selectModelIds = this.data.exchangeCouponData.selectModelInfo.models.join(','),
        modelItems = this.data.exchangeCouponData.goodsInfo.model_items,
        data = {};

    for (var i = modelItems.length - 1; i >= 0; i--) {
      if(modelItems[i].model == selectModelIds){
        data['exchangeCouponData.selectModelInfo.stock'] = modelItems[i].stock;
        data['exchangeCouponData.selectModelInfo.price'] = modelItems[i].price;
        data['exchangeCouponData.selectModelInfo.modelId'] = modelItems[i].id;
        data['exchangeCouponData.selectModelInfo.imgurl'] = modelItems[i].img_url;
        break;
      }
    }
    this.setData(data);
  },
  exchangeCouponConfirmGoods: function(){
    let _this = this;
    let goodsInfo = _this.data.exchangeCouponData.goodsInfo;
    let model = goodsInfo.model;
    let selectModels = _this.data.exchangeCouponData.selectModelInfo.models;
    let model_value_str = '';
    if(selectModels.length > 0){
      model_value_str = '(';
      for (let i = 0; i < selectModels.length; i++) {
        let selectSubModelId = model[i].subModelId;
        for (let j = 0; j < selectSubModelId.length; j++) {
          if( selectModels[i] == selectSubModelId[j] ){
            model_value_str += model[i].subModelName[j] + '|';
          }
        }
      }
      model_value_str += ')';
    }
    goodsInfo['model_value_str'] = model_value_str;
    _this.setData({
      'exchangeCouponData.dialogHidden': true,
      'exchangeCouponData.selectModelInfo': {},
      'exchangeCouponData.hasSelectGoods': true,
      'exchangeCouponData.voucher_coupon_goods_info': {
        goods_id: goodsInfo.id,
        num: 1,
        model_id: _this.data.exchangeCouponData.selectModelInfo.modelId
      },
      'exchangeCouponData.goodsInfo': goodsInfo
    });
    _this.getCalculationInfo();
  },
  inputGoodsCount: function (e) {
    let value = +e.detail.value;
    let index = e.target.dataset.index;

    if (isNaN(value) || value <= 0) {
      return;
    }
    clearTimeout(this.inputTimer);
    this.inputTimer = setTimeout(() => {
      this.changeGoodsNum(index, value);
    }, 500);
  }
})
