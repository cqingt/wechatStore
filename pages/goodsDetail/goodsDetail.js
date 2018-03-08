var app = getApp()
var util = require('../../utils/util.js')
var WxParse = require('../../components/wxParse/wxParse.js');

Page({
  data: {
    "suspension": { // 侧边栏
      "type": "suspension",
      "style": "opacity:1;color:#fff;font-size:46.875rpx;margin-left:auto;",
      "list_style": "margin-bottom:2.34375rpx;background-color:rgba(0,0,0,0.5);margin-left:auto;",
      "suspension_bottom": 100
    },
    goodsId: '',
    goodsInfo: {},
    modelStrs: {},
    selectModelInfo: {
      models: [],
      stock: '',
      price: '',
      virtualPrice: '',
      buyCount: 1,
      models_text : ''
    },
    pageQRCodeData:{
      shareDialogShow: "100%",
      shareMenuShow: false,
    },
    commentNums: 0,
    commentExample: {
      "buyer_headimgurl": "http:\/\/cdn.jisuapp.cn\/zhichi_frontend\/static\/webapp\/images\/default_photo.png", 
      "buyer_nickname": "default", 
      "add_time": 
      "2018-02-06 18:26", 
      "assess_info": { 
        "content": "\u8bc4\u8bba\u5185\u5bb9", 
        "has_img": 1, 
        "img_arr": [
          "https:\/\/img.yzcdn.cn\/upload_files\/2016\/11\/25\/FpqPXlrMRjKwJs8VdTu3ZDJCj4j5.jpeg?imageView2\/2\/w\/200\/h\/200\/q\/90\/format\/jpeg", 
          "http:\/\/img.weiye.me\/zcimgdir\/thumb\/t_148939466558c65be937c02.png"
          ]
      }
    },
    defaultPhoto: '',
    allStock: '',
    addToShoppingCartHidden: true,
    ifAddToShoppingCart: true,
    priceDiscountStr: '',
    page_hidden: true,
    appointmentPhone:'',
    cart_num:0,
    contact: '',
  },
  onLoad: function(options){
    var goodsId = options.detail,
        cartGoodsNum = options.cart_num || 0,
        defaultPhoto = app.getDefaultPhoto();

    this.setData({
      goodsId: goodsId,
      contact: true,
      defaultPhoto: defaultPhoto,
      cartGoodsNum: cartGoodsNum,
      goodsType : 0,
      hidestock : false,
      isShowVirtualPrice: true,
    })
    this.dataInitial();
  },
  dataInitial: function () {
    var that = this;
    app.sendRequest({
      url: '/App/getGoods',
      data: {
        data_id: this.data.goodsId
      },
      success: that.modifyGoodsDetail,
      complete: function(){
        that.setData({
          page_hidden: false
        })
      }
    })
  },
  scrollPageTop: function () {
    app.pageScrollTo(0);
  },
  onShareAppMessage: function(){
    this.setData({
      pageQRCodeData: {
        shareDialogShow: "100%",
        shareMenuShow: false,
      }
    })
    let goodsId = this.data.goodsId,
        contact = this.data.contact,
        path = '/pages/goodsDetail/goodsDetail?detail=' + goodsId + '&contact=' + contact;

    return app.shareAppMessage({path: path});
  },
  onUnload: function () {
    if(this.downcount){
      this.downcount.clear();
    }
  },
  goToMyOrder: function(){
    var pagePath = '/pages/myOrder/myOrder';
    app.turnToPage(pagePath, true);
  },
  goToShoppingCart: function(){
    var pagePath = '/pages/shoppingCart/shoppingCart';
    app.turnToPage(pagePath, true);
  },
  goToHomepage: function(){
    var router = app.getHomepageRouter();
    app.reLaunch({url: '/pages/'+router+'/'+router});
  },
  goToCommentPage: function(){
    var pagePath = '/pages/goodsComment/goodsComment?detail='+this.data.goodsId;
    app.turnToPage(pagePath);
  },
  modifyGoodsDetail: function(res){
    var _this = this,
        goods = res.data,
        unitType = {},
        description = goods.description,
        goodsModel = [],
        selectModels = [],
        modelStrs = {},
        price = 0,
        discountStr = '',
        allStock = 0,
        selectStock, selectPrice, selectModelId, matchResult,selectVirtualPrice,selectText = '',
        selectImgurl = '',
        appointment_desc,
        appointmentPhone; 
        this.setData({
          unitType: unitType,
          appointmentDesc: goods.appointment_info && goods.appointment_info.appointment_desc ? goods.appointment_info.appointment_desc.replace(/<br \/>/g, "\r\n") : '更多优惠资讯详情请联系商家!',
          appointmentPhone: goods.appointment_info && goods.appointment_info.appointment_phone ? goods.appointment_info.appointment_phone:'',
          displayComment:goods.appointment_info &&  goods.appointment_info.display_comment == '1' ?goods.appointment_info.display_comment : ''
        });
        makePhone:WxParse.wxParse('wxParseDescription', 'html', description, _this, 10);

    if(goods.model_items.length){
      var items = goods.model_items;

      for (let i = 0; i < items.length; i++) {
        price = Number(items[i].price);
        let virtual_price = Number(items[i].virtual_price);
        goods.highPrice = goods.highPrice > price ? goods.highPrice : price;
        goods.lowPrice = goods.lowPrice < price ? goods.lowPrice : price;
        if (virtual_price != 0){
          goods.virtual_highPrice = goods.virtual_highPrice ? (goods.virtual_highPrice > virtual_price ? goods.virtual_highPrice : virtual_price) : virtual_price;
        }
        allStock += Number(items[i].stock);
        if(i == 0){
          selectPrice = price;
          selectStock = items[0].stock;
          selectModelId = items[0].id;
          selectImgurl = items[0].img_url;
          selectVirtualPrice = items[0].virtual_price;
        }
      }
      
    } else {
      selectPrice = goods.price;
      selectStock = goods.stock;
      selectVirtualPrice = goods.virtual_price;
      selectImgurl = goods.cover;
    }
    for(var key in goods.model){
      //if (!('1' in goods.model)) {
        //delete goods.model[0];
      //}
      //if(key){
        var model = goods.model[key];
        goodsModel.push(model);
        if(model && model.subModelName){
          modelStrs[key] = model.subModelName.join('、');                  
          selectModels.push(model.subModelId[0]);
          selectText += '“' + model.subModelName[0] + '” ';
        }
      //}
    }
    goods.model = goodsModel;
    _this.setData({
      goodsInfo: goods,
      modelStrs: modelStrs,
      'selectModelInfo.models': selectModels,
      'selectModelInfo.stock': selectStock,
      'selectModelInfo.price': selectPrice,
      'selectModelInfo.modelId': selectModelId,
      'selectModelInfo.models_text' : selectText,
      'selectModelInfo.imgurl' : selectImgurl,
      'selectModelInfo.virtualPrice': selectVirtualPrice,
      allStock: allStock,
      priceDiscountStr: discountStr,
      commentNums: goods.assess_total,
      commentExample: goods.assess,
      displayComment: + goods.assess_total > 0 ? false : true
    });
    //_this.getAssessList();
  },
  // 评价
  getAssessList: function(){
    var that = this;
    app.getAssessList({
      method: 'post',
      header: {
        'content-type': 'application/x-www-form-urlencoded;'
      },
      data: {
        goods_id: that.data.goodsId,
        idx_arr: {
          idx: 'level',
          idx_value: 0
        },
        page: 1,
        page_size: 20,
      },
      success: function(res){
        var commentExample = res.data[0];
        if (res.data.length < 1) {
          return false;
        }
        that.setData({
          commentNums: res.num,
          commentExample: commentExample,
          displayComment: + res.num[0] > 0 ? false : true
        });
      }
    });
  },
  showBuyDirectly: function(){
    this.setData({
      addToShoppingCartHidden: false,
      ifAddToShoppingCart: false
    })
  },
  showAddToShoppingCart: function(){
    this.setData({
      addToShoppingCartHidden: false,
      ifAddToShoppingCart: true
    })
  },
  hiddeAddToShoppingCart: function(){
    this.setData({
      addToShoppingCartHidden: true
    })
  },
  selectSubModel: function(e){
    var dataset = e.target.dataset,
        modelIndex = dataset.modelIndex,
        submodelIndex = dataset.submodelIndex,
        data = {},
        selectModels = this.data.selectModelInfo.models,
        model = this.data.goodsInfo.model,
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
    data['selectModelInfo.models'] = selectModels;
    data['selectModelInfo.models_text'] = text;
    data['selectModelInfo.buyCount'] = 1;
    this.setData(data);
    this.resetSelectCountPrice();
  },
  resetSelectCountPrice: function(){
    var _this = this,
        selectModelIds = this.data.selectModelInfo.models.join(','),
        modelItems = this.data.goodsInfo.model_items,
        data = {};

    for (var i = modelItems.length - 1; i >= 0; i--) {
      if(modelItems[i].id == selectModelIds){
        data['selectModelInfo.stock'] = modelItems[i].stock;
        data['selectModelInfo.price'] = modelItems[i].price;
        data['selectModelInfo.modelId'] = modelItems[i].id;
        data['selectModelInfo.imgurl'] = modelItems[i].img_url;
        data['selectModelInfo.virtualPrice'] = modelItems[i].virtual_price;
        break;
      }
    }
    this.setData(data);
  },
  clickMinusButton: function(e){
    var count = this.data.selectModelInfo.buyCount;

    if(count <= 1){
      return;
    }
    this.setData({
      'selectModelInfo.buyCount': count - 1
    });
  },
  clickPlusButton: function(e){
    var selectModelInfo = this.data.selectModelInfo,
        goodsInfo = this.data.goodsInfo,
        count = selectModelInfo.buyCount,
        stock = selectModelInfo.stock;

    if(count >= stock) {
      app.showModal({content: '购买数量不能大于库存'});
      return;
    }
    this.setData({
      'selectModelInfo.buyCount': count + 1
    });
  },
  sureAddToShoppingCart: function(){
    var that = this,
        param = {
          goods_id: this.data.goodsId,
          sku_id: this.data.selectModelInfo.modelId || '',
          num: this.data.selectModelInfo.buyCount
        };

    app.sendRequest({
      hideLoading: true,
      url: '/App/addCart',
      data: param,
      success: function(res){
        app.showToast({
          title: '添加成功',
          icon: 'success'
        });

        setTimeout(function(){
          that.hiddeAddToShoppingCart();
        }, 1000);
      }
    })
  },
  buyDirectlyNextStep: function(e){
    var that = this,
        param = {
          goods_id: this.data.goodsId,
          sku_id: this.data.selectModelInfo.modelId || '',
          num: this.data.selectModelInfo.buyCount
        };

    app.sendRequest({
      url: '/App/addCart',
      data: param,
      success: function(res){
        var cart_arr = [res.data],
            pagePath = '/pages/previewGoodsOrder/previewGoodsOrder?cart_arr='+ encodeURIComponent(cart_arr);
        that.hiddeAddToShoppingCart();
        app.turnToPage(pagePath);
      }
    })
  },
  makeAppointment: function(){
    var unitTime = this.data.modelStrs[0] && this.data.modelStrs[0].substring(this.data.modelStrs[0].length-1),
        unitType = unitTime == '分' ? 1:(unitTime == '时'? 2 : 3),
        pagePath = '/pages/makeAppointment/makeAppointment?detail='+this.data.goodsId +('&param=' + unitType)
    app.turnToPage(pagePath);
  },
  inputBuyCount: function(e){
    var count = +e.detail.value,
        selectModelInfo = this.data.selectModelInfo,
        goodsInfo = this.data.goodsInfo,
        stock = +selectModelInfo.stock;

    if(count >= stock) {
      count = stock;
      app.showModal({content: '购买数量不能大于库存'});
    }
    this.setData({
      'selectModelInfo.buyCount': +count
    });
  },
  showQRCodeComponent:function(){
    let that = this;
    let goodsInfo = this.data.goodsInfo;
    let animation = wx.createAnimation({
      timingFunction: "ease",
      duration: 400,
    })
    app.sendRequest({
      url: '/App/shareQRCode',
      data: {
        obj_id: that.data.goodsId,
        type: 1,
        text: goodsInfo.title,
        price: (goodsInfo.highPrice > goodsInfo.lowPrice && goodsInfo.lowPrice != 0 ? (goodsInfo.lowPrice + ' ~ ' + goodsInfo.highPrice) : goodsInfo.price),
        goods_img: goodsInfo.img_urls ? goodsInfo.img_urls[0] : goodsInfo.cover
      },
      success: function (res) {
        animation.bottom("0").step();
        that.setData({
          "pageQRCodeData.shareDialogShow": 0,
          "pageQRCodeData.shareMenuShow": true,
          "pageQRCodeData.page": that,
          "pageQRCodeData.imageUrl": res.data,
          "pageQRCodeData.animation": animation.export()
        })
      }
    })
  },
  showShareMenu: function(){
    app.showShareMenu();
  },
  clickPlusImages: function (e) {
    wx.previewImage({
      current: e.currentTarget.dataset.src,
      urls: e.currentTarget.dataset.srcarr
    })
  },
  makePhoneCall: function(){
    app.makePhoneCall(this.data.appointmentPhone);
  },
  hideShareMenu: function(){
    this.setData({
      hideShareMenu: true
    })
  },
  showPageCode: function(){
  },
})