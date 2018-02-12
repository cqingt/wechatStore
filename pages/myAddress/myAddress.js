
var app = getApp()

Page({
  data: {
    selectAddressId: '114603',
    orderId: '',
    addressList: [],
    afterInitial: false,
    isFromBack: false,
    from: '',
    fromAddAdress: false,
    showNewAddressDialog: true,
    address_id: '',
    changeLocal: 0,
    localAddress: '',
    selectProCityDirs: true
  },
  subShopId: '',
  onLoad: function(options){
    var that = this,
        selectAddressId = options.id || '',
        orderId = options.oid || '',
        preTakeout = options.preTakeout || '',
        locateAddress = options.locateAddress || '',
        localLatLng = app.globalData.takeoutAddressInfoByLatLng || '',
        from = options.from || '';
    this.locateAddress = locateAddress;
    this.setData({
      orderId: orderId,
      preTakeout: preTakeout,
      localAddress: locateAddress,
      localLatLng: localLatLng
    })
    this.selectAddressId = selectAddressId;
    this.from = from;
    this.subShopId = options.sub_shop_id || '';
    this.getAddressList(selectAddressId, orderId, from)
  },
  onShow: function(){
    if(this.data.isFromBack){
      var that = this;
    } else {
      this.setData({
        isFromBack: true
      })
    };
    this.getAddressList(this.selectAddressId, this.data.orderId, this.from)
  },
  getAddressList: function (selectAddressId, orderId, from){
    let that = this;
    let takeoutLocate = app.globalData.takeoutLocate;
    let shopInfo = app.globalData.takeoutShopInfo
    let addressList = [];
    let hasInDistance = true;
    app.sendRequest({
      url: '/App/addressList',
      success: function(res){
        let address = res.data;
        for(var i = 0, j = address.length-1 ; i <= j; i++){
          if (from == 'previewtakeout') {
            address[i].is_distance = app.calculationDistanceByLatLng(shopInfo.latitude, shopInfo.longitude, address[i].latitude, address[i].longitude) < shopInfo.deliver_distance ? 1 : 0;
          }
          if (address[i].is_distance == 0) {
            hasInDistance = false;
          }
          addressList.push(address[i]);
        }
        if (selectAddressId || orderId || from) {
          that.setData({
            addressList: addressList,
            selectAddressId: selectAddressId,
            orderId: orderId,
              from: from,
              hasInDistance: hasInDistance
          })
        }else{
          that.setData({
            addressList: addressList,
            hasInDistance: hasInDistance
          })
        }
      }
    })
  },
  deleteAddress: function(e){
    var that = this,
        deleteId = e.target.dataset.id;

    app.showModal({
      content: '确定要删除地址？',
      showCancel: true,
      confirmText: '确定',
      cancelText: '取消',
      confirm: function(){
        app.sendRequest({
          url: '/App/delAddress',
          data: {
            address_id: deleteId
          },
          success: function(res){
            var addressList = that.data.addressList;

            for (var i = 0; i <= addressList.length - 1; i++) {
              if(addressList[i].id == deleteId){
                addressList.splice(i, 1);
              }
            }
            that.setData({
              addressList: addressList
            })
          } 
        })
      }
    })
  },
  addNewAddress:function(){
    let _this = this;
    app.turnToPage('/pages/addAddress/addAddress');
    return false;

    app.showModal({
      content:'是否导入微信收货地址',
      showCancel: true,
      confirm:(res)=>{
          app.chooseAddress({
            success: function (res) {
              app.sendRequest({
                method: 'post',
                url: '/App/addWxAddress',
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
                  _this.getAddressList(undefined, undefined, _this.data.from)
                }
              })
            }
          })
      },
      cancel:function(){
        app.turnToPage('/pages/addAddress/addAddress');
      }
    })
  },
  selectAddress: function(e){
    var addressId = e.currentTarget.dataset.id,
        that = this,
        pages = getCurrentPages(),
        prePage = pages[pages.length - 2],
        addressList = this.data.addressList;

    this.setData({
      selectAddressId: addressId
    })

      for (var i = addressList.length - 1; i >= 0; i--) {
        if(addressList[i].id == addressId){
          prePage.setData({
            selectAddress: addressList[i]
          });
          typeof prePage.selectAddressCallback === 'function' && prePage.selectAddressCallback(addressList[i]);
        }
      };
      app.turnBack();
  },
  changeFreightWay:function(){
    var _this = this;
    app.sendRequest({
      url: '/App/changeOrder',
      data: {
        order_id: _this.data.orderId,
        sub_shop_app_id: _this.subShopId
      },
      success: function (res) {
        let router = 'orderDetail';
        let url = '/pages/' + router + '/' + router + '?detail=' + res.data[0].form_data.order_id +'&franchisee=' + _this.subShopId;
        app.turnToPage(url, true);
      }
    });
  },
  editAddress: function(e){
    let addressId = e.currentTarget.dataset.id;
    app.turnToPage('/pages/addAddress/addAddress?id='+addressId);
  }
})
