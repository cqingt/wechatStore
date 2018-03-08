
var app = getApp()

Page({
  data: {
    addressId: '',
    orderId: '',
    detail: '',
    isDefault: 0,
    selectAddressId: '',
    addressList: [],
    isFromBack: false,
    from: '',
    showNewAddressDialog: true,
    address_id: '',
    localAddress: '',
    address_info: {
      name: '',
      contact: '',
      province: '',
      city: '',
      district: '',
      detailAddress: '',
      sex: 1,
      label: 3,
    },
    region: ['选择省', '选择市', '选择区'],
    selectRegion: [0, 0, 0],
    selectRegionId: [0, 0, 0]
  },
  onLoad: function(options){
    var id = options.id || '';
    var orderId = options.oid || '';

    this.setData({
      addressId: id,
      orderId: orderId
    })
    this.dataInitial();
  },
  dataInitial: function(){
    let id = this.data.addressId;
    if(id){
      this.getAddressDetail(id);
    }
  },
  bindRegionChange: function (e) {
    console.log('picker发送选择改变，携带值为', e.detail.value)
    var region = e.detail.value;
    this.setData({
      'address_info.province': region[0],
      'address_info.city': region[1],
      'address_info.district': region[2],
      region: e.detail.value
    })
  },
  getAddressDetail: function(id){
    var that = this;
    app.sendRequest({
      url: '/App/getAddressById',
      data: { address_id: id },
      success: function(res){
        var data = res.data;
        that.setData({
          'address_info.name': data.address_info.name,
          'address_info.contact': data.address_info.contact || data.telphone,
          'address_info.province': data.address_info.province || '选择省',
          'address_info.city': data.address_info.city || '选择市',
          'address_info.district': data.address_info.district || '选择区',
          'address_info.detailAddress': data.address_info.detailAddress || data.detail_address,
          'address_info.sex': data.address_info.sex || 2,
          'address_info.label': data.address_info.label || 3,
          'region': [data.address_info.province, data.address_info.city, data.address_info.district]
        })
      }
    });
  },
  nameInput: function(e){
    this.setData({
      name: e.detail.value
    })
  },
  contactInput: function(e){
    this.setData({
      contact: e.detail.value
    })
  },
  detailInput: function(e){
    this.setData({
      detail: e.detail.value
    })
  },
  setAddress: function(addressId){
    var orderId = this.data.orderId;

    app.sendRequest({
      url: '/App/setAddress',
      data: {
        order_id: orderId,
        address_id: addressId
      },
      success: function(res){
        app.turnBack();
      }
    });
  },
  setDefaultAddress: function(e){
    var checked = e.detail.value;
    if(checked){
      this.setData({
        isDefault: 1
      })
    } else {
      this.setData({
        isDefault: 0
      })
    }
  },
  sureAddAddress: function () {
    let _this = this;
    let addressInfo = _this.data.address_info;
    let addressId = _this.data.addressId;
    if (!addressInfo.name) {
      app.showModal({
        content: '联系人不能为空',
      })
      return;
    }
    if (!addressInfo.contact) {
      app.showModal({
        content: '电话不能为空',
      })
      return;
    }
    if (!addressInfo.province || !addressInfo.city || !addressInfo.district) {
      app.showModal({
        content: '省市区不能为空',
      })
      return;
    }
    if (!/^1[0-9]{10}$/.test(addressInfo.contact)) {
      app.showModal({
        content: '请填写正确的手机号',
      })
      return;
    }
    if (!addressInfo.detailAddress) {
      app.showModal({
        content: '补充信息不能为空',
      })
      return;
    }
    app.sendRequest({
      url: '/App/addAddress',
      method: 'post',
      data: {
        address_info: addressInfo,
        address_id: addressId,
        is_default: 0
      },
      success: function (res) {
        app.showToast({
          title: '保存成功'
        })
        app.turnBack();
      }
    });
  },
  cancelAddAddress: function () {
    let address = {
      name: '',
      contact: '',
      province: '',
      city: '',
      district: '',
      detailAddress: '',
      sex: 1,
      label: 3,
    };
    app.turnBack();
  },

  addAdressName: function (e) {
    this.setData({
      'address_info.name': e.detail.value
    })
  },
  addAdressContact: function (e) {
    this.setData({
      'address_info.contact': e.detail.value
    })
  },
  addAdressDetailAddress: function (e) {
    this.setData({
      'address_info.detailAddress': e.detail.value
    })
  },
  selectAddressLabel: function (e) {
    this.setData({
      'address_info.label': e.currentTarget.dataset.label
    })
  },
  selectAddressSex: function (e) {
    this.setData({
      'address_info.sex': e.currentTarget.dataset.sex
    })
  },
  addSelectAddress: function () {
    app.turnToPage('/pages/searchAddress/searchAddress?from=addAddress');
  }
})
