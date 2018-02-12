
var app = getApp()

Page({
  data: {
    userInfo: {
      nickname: '',
      sex: 0,
      cover_thumb: 'http://img.zhichiwangluo.com/zc_app_default_photo.png',
      phone: ''
    },
    genderArr: ['男', '女'],
    isFromBack: false
  },
  onLoad: function(){
    var userInfo = app.getUserInfo(),
        data = {
          'userInfo.nickname': userInfo.nickname,
          'userInfo.sex': userInfo.sex,
          'userInfo.cover_thumb': userInfo.cover_thumb,
          'userInfo.phone': userInfo.phone || ''
        };

    this.setData(data);
  },
  onShow: function(){
    if(this.data.isFromBack){
      var phone = app.getUserInfo().phone;
      if(phone){
        this.setData({
          'userInfo.phone': phone
        })
      }
    } else {
      this.setData({
        isFromBack: true
      });
    }
  },
  choosePhoto: function(){
    var that = this;
    app.chooseImage(function(imgUrl){
      that.setData({
        'userInfo.cover_thumb': imgUrl
      })
    });
  },
  changeGender: function(e){
    this.setData({
      'userInfo.sex': e.detail.value
    })
  },
  inputNickname: function(e){
    this.setData({
      'userInfo.nickname': e.detail.value
    })
  },
  saveUserInfo: function(){
    var data = this.data.userInfo;

    app.sendRequest({
      url: '/App/saveUserInfo',
      method: 'post',
      data: data,
      success: function(res){
        if(res.status === 0){
          app.setUserInfoStorage(data);
          app.turnBack();
        }
      }
    });
  },
  bindCellphonePage: function(){
    app.turnToPage('/pages/bindCellphone/bindCellphone');
  }

})




