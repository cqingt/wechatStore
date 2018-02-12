
var app = getApp()

Page({
  data: {
    editing: false,
    goodsCount: 0,
    goodsCountToPay: 0,
    priceToPay: 0.00,
    goodsList: [],
    selectAll: false,
    editSelectAll: false,
    timeout: null,
    isFromBack: false,
    notBussinessTimeGoodId: []
  },
  franchiseeId: '',
  isFromUserCenterEle: '',
  onLoad: function(options){
    this.franchiseeId = options.franchisee || '';
    this.isFromUserCenterEle = options.from || '';
    this.getShoppingCartData();
  },
  onShow: function(){
    if(this.data.isFromBack){
      this.getShoppingCartData();
      this.setData({
        selectAll: false
      });
    } else {
      this.setData({
        isFromBack: true
      });
    }
  },
  getShoppingCartData: function(){
    var that = this,
        franchiseeId = this.franchiseeId,
        fromUserCenterEle = this.data.isFromUserCenterEle;

    // 获取购物车列表时 传sub_shop_app_id获取
    app.sendRequest({
      url: '/App/cartList',
      data: {
        page: 1,
        page_size: 100,
      },
      success: function(res){
        console.log(res.data);
        for (var i = res.data.length - 1; i >= 0; i--) {
          var modelArr = res.data[i].model_value;

          if(modelArr && modelArr.join){
            res.data[i].model_value_str = '('+modelArr.join('|')+')';
          }
        }
        that.setData({
          goodsCount: res.data.length,
          goodsList: res.data
        });
        that.clickSelectAll();
        //that.getTostoreNotBusinessTime();
        that.recalculateCountPrice();
      }
    })
  },
  gotoGoodsDetail: function(e) {
    var pagePath = '/pages/goodsDetail/goodsDetail?detail=' + e.currentTarget.dataset.goodsid;
    app.turnToPage(pagePath);
  },
  switchToEdit: function(){
    this.setData({
      editing: true
    })
  },
  editComplete: function(){
    var list = this.data.goodsList;

    for (var i = list.length - 1; i >= 0; i--) {
      list[i].editSelected = false;
    }

    this.setData({
      editing: false,
      goodsList: list
    })
    this.recalculateCountPrice();
  },
  clickSelectAll: function(){
    var alreadySelect = this.data.selectAll,
        list = this.data.goodsList;

    if(alreadySelect){
      for (var i = list.length - 1; i >= 0; i--) {
        list[i].selected = false;
      }
    } else {
      for (var i = list.length - 1; i >= 0; i--) {
        list[i].selected = true;
      }
    }
    this.setData({
      selectAll: !alreadySelect,
      goodsList: list
    })
    this.recalculateCountPrice();
  },
  getTostoreNotBusinessTime: function (payIdArr , sucfn){
    var that = this;
    app.sendRequest({
      url: '/App/precheckShoppingCart',
      method: 'post',
      data: {
        cart_arr: payIdArr || ''
      },
      success: function (res) {
        sucfn && sucfn();
      },
      successStatusAbnormal: function(res){
        app.showModal({
          content: res.data
        });
        if(res.status == 1){
          var goodsId = res.expired_goods_arr || [],
              list = that.data.goodsList;
          if (goodsId && goodsId.length){
            for (var i = 0; i < goodsId.length; i++) {
              var id = goodsId[i].goods_id;
              for (var j = list.length - 1; j >= 0; j--) {
                if (id == list[j].goods_id) {
                  list[j].selected = false;
                }
              };
            }
            that.setData({
              selectAll: false,
              goodsList: list,
              notBussinessTimeGoodId: goodsId
            })
            that.recalculateCountPrice();   
          }
        }
      }
    })
  },
  clickEditSelectAll: function(){
    var alreadySelect = this.data.editSelectAll,
        list = this.data.goodsList;

    if(alreadySelect){
      for (var i = list.length - 1; i >= 0; i--) {
        list[i].editSelected = false;
      };
    } else {
      for (var i = list.length - 1; i >= 0; i--) {
        list[i].editSelected = true;
      };
    }

    this.setData({
      editSelectAll: !alreadySelect,
      goodsList: list
    })
  },
  clickSelectGoods: function(e){
    var index = e.currentTarget.dataset.index,
        list = this.data.goodsList,
        selectAll = true;

    list[index].selected = !list[index].selected;
    for (var i = list.length - 1; i >= 0; i--) {
      if(!list[i].selected){
        selectAll = false;
        break;
      }
    }
    this.setData({
      goodsList: list,
      selectAll: selectAll
    })
    this.recalculateCountPrice();
  },
  clickEditSelectGoods: function(e){
    var index = e.currentTarget.dataset.index,
        list = this.data.goodsList,
        editSelectAll = true;

    list[index].editSelected = !list[index].editSelected;
    for (var i = list.length - 1; i >= 0; i--) {
      if(!list[i].editSelected){
        editSelectAll = false;
        break;
      }
    }
    this.setData({
      goodsList: list,
      editSelectAll: editSelectAll
    })
  },
  recalculateCountPrice: function(){
    var list = this.data.goodsList,
        totalCount = 0,
        price = 0;

    for (var i = list.length - 1; i >= 0; i--) {
      var goods = list[i];
      if(goods.selected){
        totalCount += +goods.num;
        price += +goods.price * +goods.num;
      }
    }

    this.setData({
      goodsCountToPay: totalCount,
      priceToPay: price.toFixed(2)
    })
  },
  deleteGoods: function(){
    var deleteIdArr = [],
        list = this.data.goodsList,
        listExcludeDelete = [],
        franchiseeId = this.franchiseeId,
        fromUserCenterEle = this.data.isFromUserCenterEle,
        that = this;

    for (var i = list.length - 1; i >= 0; i--) {
      if(list[i].editSelected){
        deleteIdArr.push(+list[i].id);
      } else {
        listExcludeDelete.push(list[i]);
      }
    }
    if(!deleteIdArr.length) { return; }

    app.sendRequest({
      url: '/App/deleteCart',
      method: 'post',
      data: {
        cart_id_arr: deleteIdArr,
        sub_shop_app_id: fromUserCenterEle ? '' : franchiseeId
      },
      success: function(res){
        that.setData({
          goodsList: listExcludeDelete,
          goodsCount: listExcludeDelete.length
        })
      }
    });
  },
  goToPay: function(e){
    var list = this.data.goodsList,
        cartIdArray = [],
        payIdArr = [],
        that = this;

    for (var i = list.length - 1; i >= 0; i--) {
      var li = list[i];
      if(li.selected){
        cartIdArray.push(li.id);
        payIdArr.push({
          cart_id: li.id,
          goods_id: li.goods_id,
          model_id: li.model_id,
          model: li.model,
          num: li.num,
          goods_type: li.goods_type
        });
      }
    }

    if(!payIdArr.length) {
      app.showModal({
        content: '请选择结算的商品'
      });
      return;
    }

    // 当购物车勾选商品种类全部相同时 不生成订单而是跳转到预览订单页面
    that.getTostoreNotBusinessTime(payIdArr , function() {
      var pagePath = '/pages/previewGoodsOrder/previewGoodsOrder?cart_arr='+encodeURIComponent(cartIdArray);
      app.turnToPage(pagePath);
    });
  },
  clickMinusButton: function(e){
    var index = e.currentTarget.dataset.index,
        num = this.data.goodsList[index].num,
        fromUserCenterEle = this.data.isFromUserCenterEle,
        franchiseeId = this.franchiseeId,
        deleteId = this.data.goodsList[index].id,
        that = this;
    if(num-1 <= 0){
      app.showModal({
        content: '确定从购物车删除该商品？',
        showCancel: true,
        confirm: function () {
          app.sendRequest({
            url: '/App/deleteCart',
            method: 'post',
            data: {
              cart_id_arr: [deleteId],
              sub_shop_app_id: fromUserCenterEle ? '' : franchiseeId
            },
            success: function (res) {
              that.setData({
                selectAll:false
              });
              that.getShoppingCartData();
            }
          });
        }
      })
      return;
    }
    this.changeGoodsNum(index, 'minus');
  },
  clickPlusButton: function(e){
    var index = e.currentTarget.dataset.index;
    this.changeGoodsNum(index, 'plus');
  },
  changeGoodsNum: function(index, type){
    var goods = this.data.goodsList[index],
        currentNum = +goods.num,
        targetNum = type == 'plus' ? currentNum + 1 : currentNum - 1,
        that = this,
        data = {},
        param;
    if (targetNum > goods.stock ){
      app.showModal({
        content: '库存不足'
      });
      return;
    }

    param = {
      goods_id: goods.goods_id,
      model_id: goods.model_id || '',
      num: targetNum,
      sub_shop_app_id: this.franchiseeId,
      is_seckill : goods.is_seckill == 1 ? 1 : ''
    };

    app.sendRequest({
      url: '/App/addCart',
      data: param,
      success: function (res) {
        data = {};
        data['goodsList[' + index + '].num'] = targetNum;
        that.setData(data);
        that.recalculateCountPrice();
      },
      successStatusAbnormal: function(res){
        app.showModal({
          content: res.data
        })
      }
    })
  },
  inputGoodsCount: function(e){
    let index = e.target.dataset.index,
        count = e.detail.value,
        franchiseeId = this.franchiseeId,
        data = {},
        that = this,
        goods = this.data.goodsList[index],
        param = {
          goods_id: goods.goods_id,
          model_id: goods.model_id || '',
          num: count,
          sub_shop_app_id: this.franchiseeId,
          is_seckill: goods.is_seckill == 1 ? 1 : ''
        };
    if (count == '') {
      return;
    }
    if (count == 0) {
      app.showModal({
        content: '请输入大于0的数字',
      })
      return;
    }
    app.sendRequest({
      url: '/App/addCart',
      data: param,
      success: function (res) {
        data = {};

        data['goodsList[' + index + '].num'] = count;
        that.setData(data);
        that.recalculateCountPrice();
      },
      successStatusAbnormal: function (res) {
        app.showModal({
          content: res.data
        })
      }
    })
  }
})
