
var app = getApp()

Page({
  data: {
    selectAddressId: '',
    addressList: [],
    afterInitial: false,
    isFromBack: false,
    from: '',
    fromAddAdress: false,
    address_id: '',
    localAddress: '',
    selectProCityDirs: true,
    selectRegion: [0,0,0],
    selectRegionId: [0,0,0]
  },
  subShopId: '',
  onLoad: function(options){
    var that = this,
        from = options.from,
        locateAddress = options.locateAddress,
        localLatLng = app.globalData.takeoutAddressInfoByLatLng;
    this.getArea(0, (res) =>{
      let initData = [{id: 0, name: '请选择', city:[{id: 0, name: '请选择', dirstrict:[{id: 0, name: '请选择' }]}]}]
      initData = initData.concat(res)
      that.setData({
        province: initData
      })
    });
    this.locateAddress = locateAddress;
    this.setData({
      from: from,
      localAddress: locateAddress
    })
    if (from == 'addAddress') {
      wx.setNavigationBarTitle({
        title: '选择收货地址'
      })
    } else if (from == 'takeout'){
      wx.setNavigationBarTitle({
        title: '选择定位地址'
      })
    } else {
      wx.setNavigationBarTitle({
        title: '搜索地址'
      })
    }
    this.subShopId = options.sub_shop_id || '';
    this.getLocation();
    this.getAddressList(from)
  },
  onShow: function(){
    if(this.data.isFromBack){
      var that = this;
    } else {
      this.setData({
        isFromBack: true
      })
    };
  },
  getAddressList: function (from) {
    let that = this;
    let takeoutLocate = app.globalData.takeoutLocate;
    let shopInfo = app.globalData.takeoutShopInfo
    let addressList = [];
    let hasInDistance = true;
    app.sendRequest({
      url: '/index.php?r=AppShop/addressList',
      success: (res) => {
        let address = res.data;
        for (var i = 0, j = address.length - 1; i <= j; i++) {
          if (from == 'takeout') {
            address[i].is_distance = app.calculationDistanceByLatLng(shopInfo.latitude, shopInfo.longitude, address[i].latitude, address[i].longitude) < shopInfo.deliver_distance ? 1 : 0;
          }
          if (address[i].latitude == 0) {
            hasInDistance = false;
          }
          addressList.push(address[i]);
        }
        that.setData({
          addressList: addressList,
          from: from,
          hasInDistance: hasInDistance
        })
      }
    })
  },
  selectAddress:function(e){
    let pages = getCurrentPages(),
        prePage = pages[pages.length - 2],
        addressInfo = e.currentTarget.dataset.info;
    app.globalData.takeoutAddressSelected = addressInfo;
    prePage.setData({
      'location_address': addressInfo.address_info.detailAddress,
    })
    app.globalData.takeoutLocate.lat = addressInfo.latitude || '';
    app.globalData.takeoutLocate.lng = addressInfo.longitude || '';
    app.turnBack();
  },
  showProDialog:function(){
    this.setData({
      selectProCityDirs: false,
      regionStr: this.oldRegionStr || ''
    })
    this.region = this.data.selectRegion;
    this.regionid = this.data.selectRegionId;
    this.oldRegionStr = this.data.regionStr;
  },
  changeRegion: function(e){
    let that = this;
    let province = this.data.province;
    let value = e.detail.value;
    if (!province[value[0]].city) {
      this.getArea(province[value[0]].id, (res) => {
        province[value[0]].city = res;
        that.getArea(province[value[0]].city[0].id, (res) => {
          province[value[0]].city[0].dirstrict = res;
          that.setData({
            province: province,
            selectRegion: [value[0], 0, 0],
            selectRegionId: [province[value[0]].id, province[value[0]].city[0].id, province[value[0]].city[0].dirstrict[0].id],
            regionStr: [province[value[0]].name, province[value[0]].city[0].name, province[value[0]].city[0].dirstrict[0].name]
          })
        })
      })
    }else{
      if (!province[value[0]].city[value[1]].dirstrict) {
        this.getArea(province[value[0]].city[value[1]].id, (res) => {
          province[value[0]].city[value[1]].dirstrict = res;
          that.setData({
            province: province,
            selectRegion: [value[0], value[1], 0],
            selectRegionId: [province[value[0]].id, province[value[0]].city[value[1]].id, province[value[0]].city[value[1]].dirstrict[0].id],
            regionStr: [province[value[0]].name, province[value[0]].city[value[1]].name, province[value[0]].city[value[1]].dirstrict[0].name]
          })
        })
      }else{
        that.setData({
          selectRegion: [value[0], value[1], value[2]],
          selectRegionId: [province[value[0]].id, province[value[0]].city[value[1]].id, province[value[0]].city[value[1]].dirstrict[value[2]].id],
          regionStr: [province[value[0]].name, province[value[0]].city[value[1]].name, province[value[0]].city[value[1]].dirstrict[value[2]].name]
        })
      }
    }
  },
  getArea: function(id, callBack){
    let that = this;
    app.sendRequest({
      url: '/index.php?r=Region/getRegionList',
      data: {pid: id},
      success: (res) =>{
        res.data = res.data.reverse()
        callBack(res.data);
      }
    })
  },
  hideProCityDirs: function(){
    wx.showLoading({
      title: '请稍等...'
    })
    let that = this;
    setTimeout(() => {
      wx.hideLoading()
      this.setData({
        selectRegionId: this.regionid,
        selectProCityDirs: true,
        regionStr: this.oldRegionStr || ""
      })
    }, 1000);
  },
  submitRegion:function(){
    wx.showLoading({
      title: '请稍等...'
    })
    let that = this;
    setTimeout(() =>{
      wx.hideLoading()
      that.setData({
        selectProCityDirs: true
      })
      that.oldRegionStr = that.data.regionStr
      if (that.data.searchInput) {
        app.sendRequest({
          url: '/index.php?r=Map/suggestion&keyword=',
          data: {
            keyword: that.data.regionStr.join('') + that.data.searchInput,
            region: that.data.regionStr[1]
          },
          success: (res) => {
            that.setData({
              searchInput: that.data.searchInput,
              searchAddress: res.data
            })
          }
        })
      }
    },1000)
  },
  getLocation: function () {
    let that = this;
    app.getLocation({
      success: (res) => {
          app._getAddressByLatLng({
            lat: res.latitude,
            lng: res.longitude
          }, (data) => {
            let lacalAddresss = data.data.address.replace(data.data.ad_info.province + data.data.ad_info.city, '');
            that.oldRegionStr = [data.data.ad_info.province, data.data.ad_info.city, data.data.ad_info.district];
            that.setData({
              regionStr: [data.data.ad_info.province, data.data.ad_info.city, data.data.ad_info.district],
              localLatLng: data.data,
              localAddress: lacalAddresss
            })
            that.locateAddress = lacalAddresss;
            that.nearbyAddress({
              lat: res.latitude,
              lng: res.longitude,
              keyword: that.locateAddress
            })
          })
      },
      fail: (res) => {
      }
    })
  },
  searchAddress:function (e) {
    let that =this;
    
    if (e.detail.value.trim() != '') {
      clearTimeout(this.searchFunc);
      this.searchFunc = setTimeout(() =>{
        app.sendRequest({
          url: '/index.php?r=Map/suggestion&keyword=',
          data:{
            keyword: that.data.regionStr.join('')+ e.detail.value,
            region: that.data.regionStr[1]
          },
          success: function (res) {
            that.setData({
              searchInput : e.detail.value,
              searchAddress: res.data
            })
          }
        })
      },1000)
    }else{
      that.setData({
        searchAddress: []
      })
    }
  },
  relocate:function (e) {
    let that = this;
    this.setData({
      localAddress: ''
    })
    app.getLocation({
      success: (res) => {
        app._getAddressByLatLng({
          lat: res.latitude,
          lng: res.longitude
        }, (data) =>{
          let lacalAddresss = data.data.address.replace(data.data.ad_info.province + data.data.ad_info.city, '')
          that.setData({
            localLatLng: data.data,
            localAddress: lacalAddresss
          })
          that.nearbyAddress({
            lat: res.latitude,
            lng: res.longitude,
            keyword: lacalAddresss
          })
        })
      }
    })
  },
  selectTakeoutRelocate:function(e){
    let info = e.currentTarget.dataset.info
    app.globalData.takeoutLocate = {
      lat: info.latitude,
      lng: info.longitude
    }
    app.turnBack();
  },
  turnBackPageByLoacl: function (e) {
    app.globalData.takeoutAddressSelected = '';
    let pages = getCurrentPages(),
        prePage = pages[pages.length - 2],
        addressDetail = e.currentTarget.dataset.addressinfo;
    prePage.setData({
      'location_address': addressDetail.address.replace(addressDetail.ad_info.province + addressDetail.ad_info.city, '')
    })
    app.globalData.takeoutLocate.lat = addressDetail.location.lat;
    app.globalData.takeoutLocate.lng = addressDetail.location.lng;
    app.turnBack();
  },
  turnBackPage:function(e){
    app.globalData.takeoutAddressSelected = '';
    let pages = getCurrentPages(),
        prePage = pages[pages.length - 2],
        type = e.currentTarget.dataset.type,
        addressDetail = e.currentTarget.dataset.addressinfo;
    let regionId = this.data.selectRegionId;
    let regionStr = this.data.regionStr;
    if (this.data.from == 'addAddress' && type == 'search'){
      prePage.setData({
        'address_info.province.id': regionId[0],
        'address_info.city.id': regionId[1],
        'address_info.district.id': regionId[2],
        'address_info.province.text': regionStr[0],
        'address_info.city.text': regionStr[1],
        'address_info.district.text': regionStr[2],
        'address_info.detailAddress': addressDetail.title
      })
    } else if (this.data.from == 'addAddress' && type == 'nearby'){
      prePage.setData({
        'address_info.province.text': addressDetail.ad_info.province,
        'address_info.city.text': addressDetail.ad_info.city,
        'address_info.district.text': addressDetail.ad_info.district || '',
        'address_info.detailAddress': addressDetail.title
      })
    } else if (this.data.from == 'takeout'){
      prePage.setData({
        'location_address': addressDetail.title
      })
      app.globalData.takeoutLocate.lat = addressDetail.location.lat;
      app.globalData.takeoutLocate.lng = addressDetail.location.lng;
    }
    app.turnBack();
  },
  nearbyAddress: function(option) {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=Map/searchAreaInfo',
      data: {
        keyword: option.keyword,
        boundary: 'nearby('+option.lat+','+option.lng+',2000)'
      },
      success: (res) => {
        this.setData({
          'nearbyAddress': res.data
        })
      }
    })
  }
})
