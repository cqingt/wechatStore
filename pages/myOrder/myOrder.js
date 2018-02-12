
var app = getApp()

Page({
  data: {
    suspension: { // 侧边栏
      "type": "suspension",
      "style": "opacity:1;color:#fff;font-size:46.875rpx;margin-left:auto;",
      "list_style": "margin-bottom:2.34375rpx;background-color:rgba(0,0,0,0.5);margin-left:auto;",
      "suspension_bottom": 60
    },
    orderLists: [],
    pages: 1,
    types: {
      0: [undefined, 0, 1, 2, 3,4,5,6,7]
    },
    noMore: false,
    currentTabIndex: 0,
    currentGoodsType: 0,                
    goodsTypeList: [0],
    isFromBack: false
  },
  onLoad: function(options){
    if (options.goodsType && options.currentIndex){
      this.setData({
        currentTabIndex: options.currentIndex
      })
    }
    this.dataInitial();
  },
  onShow: function(){
    return false;
    if (this.data.isFromBack) {
      this.setData({
        pages:1,
        currentTabIndex: this.data.currentTabIndex,
        noMore: false
      });
      this.getOrderList({ tabIndex: this.data.currentTabIndex});
    } else {
      this.setData({
        isFromBack: true
      })
    }
  },
  scrollPageTop: function () {
    app.pageScrollTo(0);
  },
  dataInitial: function(){
    var that = this;
    this.getOrderList({
      tabIndex: that.data.currentTabIndex,
      firstLoad: true
    });
  },
  getOrderList: function(param){
    var that = this,
        data = {
          page: that.data.pages,
          page_size: 20
        },
        type;

    if (this.data.currentGoodsType != undefined){
      var status = this.data.types[this.data.currentGoodsType][param.tabIndex];

      if (status != undefined){
        data.status = status;
      }
      data.goods_type = this.data.currentGoodsType
    }
    app.sendRequest({
      url: '/App/orderList',
      method: 'post',
      data: data,
      success: function(res){
        var data = {},
            orders = res.data;
            
        for (var i = 0; i < orders.length; i++) {
          orders[i] = orders[i];
        }

        if(param.scrollLoad){
          orders = that.data.orderLists.concat(orders);
        }

        data['orderLists'] = orders;
        data['pages'] = that.data.pages + 1;
        data['noMore'] = res.is_more == 0 ? true : false;
        data['currentGoodsType'] = 0;
        // 判断goods_type_list里面是否存在当前需要展示的列表
        if (param.firstLoad) {
          data['goodsTypeList'] = ["0"];
          if (data['goodsTypeList'].indexOf(data['currentGoodsType'].toString()) < 0){
            data['goodsTypeList'].push(data['currentGoodsType']);
          }
        }
        that.setData(data);
      }
    })
  },
  clickOrderTab: function(e){
    var dataset = e.target.dataset,
        index = dataset.index,
        data = {};
        
    data.currentTabIndex = index;
    data['pages'] = 1;
    data['orderLists'] = [];
    data['noMore'] = false;

    this.setData(data);
    this.getOrderList({tabIndex : index});
  },
  clickOrderTab2: function(e) {
    var index = this.data.currentTabIndex;
    var data = {};

    data['pages'] = 1;
    this.setData(data);
    this.getOrderList({ tabIndex: index, scrollLoad: false, firstLoad: true});
  },
  clickMeanTab: function(e){
    var dataset = e.target.dataset,
      index = dataset.index,
      data = {};

    data.currentTabIndex = 0;
    data['pages'] = 1;
    data['orderLists'] = [];
    data['noMore'] = false;
    data.currentGoodsType = dataset.goodsType;

    this.setData(data);
    this.getOrderList({ tabIndex: 0 });
  },
  // 多种商品下面的子菜单
  clickSubmenuTab: function(e){
    var dataset = e.target.dataset,
        index = dataset.index,
        data = {};

    data.currentTabIndex = index;
    data['pages'] = 1;
    data['orderLists'] = [];
    data['noMore'] = false;
    data.currentGoodsType = e.currentTarget.dataset.goodsType;

    this.setData(data);
    this.getOrderList({ tabIndex: index });
  },
  goToOrderDetail: function(e){
    var dataset = e.currentTarget.dataset,
        orderId = dataset.id,
        type = dataset.type,
        franchiseeId = dataset.franchisee,
        queryStr = franchiseeId === app.getAppId() ? '' : '&franchisee='+franchiseeId,
        router;
    
      router = 'goodsOrderDetail';
    
    app.turnToPage('/pages/'+router+'/'+router+'?detail='+orderId+queryStr);
  },
  cancelOrder: function(e){
    var orderId = e.target.dataset.id,
        franchisee = e.target.dataset.franchisee,
        subShopId = franchisee == app.getAppId() ? '' : franchisee,
        that = this;

    app.showModal({
      content: '确定要取消订单？',
      showCancel: true,
      cancelText: '否',
      confirmText: '确定',
      confirm: function(){
        app.sendRequest({
          url: '/App/cancelOrder',
          data: {
            order_id: orderId
          },
          success: function(res){
            var index = that.data.currentTabIndex,
                data = {};

            data['pages'] = 1;
            that.setData(data);
            that.getOrderList({tabIndex : index});
          }
        })
      }
    })
  },
  applyDrawback: function(e){
    var orderId = e.target.dataset.id,
        franchisee = e.target.dataset.franchisee,
        subShopId = franchisee == app.getAppId() ? '' : franchisee,
        that = this;

    app.showModal({
      content: '确定要申请退款？',
      showCancel: true,
      cancelText: '取消',
      confirmText: '确定',
      confirm: function(){
        app.sendRequest({
          url: '/App/applyRefund',
          data: {
            order_id: orderId
          },
          success: function(res){
            var index = that.data.currentTabIndex,
                data = {};

            data['pages'] = 1;
            that.setData(data);
            that.getOrderList({tabIndex : index});
          }
        })
      }
    })
  },
  checkLogistics: function(e){
    var orderId = e.target.dataset.id;
    app.turnToPage('/pages/logisticsPage/logisticsPage?detail='+orderId);
  },
  sureReceipt: function(e){
    var orderId = e.target.dataset.id,
        franchisee = e.target.dataset.franchisee,
        subShopId = franchisee == app.getAppId() ? '' : franchisee,
        that = this,
        content = this.data.currentGoodsType == '1'? '确认已消费?':'确认已收到货物?';

    app.showModal({
      content: content,
      showCancel: true,
      cancelText: '取消',
      confirmText: '确定',
      confirm: function(){
        app.sendRequest({
          url: '/App/comfirmOrder',
          data: {
            order_id: orderId,
          },
          success: function(res){
            var index = that.data.currentTabIndex,
                data = {};

            data['pages'] = 1;
            that.setData(data);
            that.getOrderList({tabIndex : index});
          }
        })
      }
    })
  },
  makeComment: function(e){
    var orderId = e.target.dataset.id,
        franchiseeId = e.target.dataset.franchisee,
        queryStr = franchiseeId === app.getAppId() ? '' : '&franchisee='+franchiseeId;
    app.turnToPage('/pages/makeComment/makeComment?detail='+orderId+queryStr);
  },
  takeoutMakeComment:function(e){
    var orderId = e.target.dataset.id,
      franchiseeId = e.target.dataset.franchisee,
      queryStr = franchiseeId === app.getAppId() ? '' : '&franchisee=' + franchiseeId;
    app.turnToPage('/pages/takeoutMakeComment/takeoutMakeComment?detail=' + orderId + queryStr);
  },
  verificationCode: function(e){
    var orderId = e.target.dataset.id;
    var franchiseeId = e.target.dataset.franchisee;
    app.turnToPage('/pages/verificationCodePage/verificationCodePage?detail=' + orderId );
  },
  scrollToListBottom: function(){
    var currentTabIndex = this.data.currentTabIndex;
    if(this.data.noMore){
      return;
    }
    this.getOrderList({
      tabIndex: currentTabIndex,
      scrollLoad: true
    });
  }
})
