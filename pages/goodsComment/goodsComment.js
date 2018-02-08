
var app = getApp()
var util = require('../../utils/util.js')

Page({
  data: {
    goodsId: '',
    commnetType: 0,
    comments: [],
    commentNums: [],
    loadPage: 1,
    "suspension": { // 侧边栏
      "type": "suspension",
      "style": "opacity:1;color:#fff;font-size:46.875rpx;margin-left:auto;",
      "list_style": "margin-bottom:2.34375rpx;background-color:rgba(0,0,0,0.5);margin-left:auto;",
      "suspension_bottom": 60
    },
  },
  onLoad: function(options){
    var goodsId = options.detail,
        franchiseeId = options.franchisee || '';

    this.setData({
      goodsId: goodsId,
      franchiseeId: franchiseeId
    })
    this.getAssessList(0, 1);
  },
  getAssessList: function(commnetType, page, append){
    var that = this;
    app.getAssessList({
      method: 'post',
      data: {
        goods_id: that.data.goodsId,
        level: commnetType,
        page: page,
        page_size: 20
      },
      success: function(res){
        var commentArr = res.data;
        if(append){
          commentArr = that.data.comments.concat(commentArr);
        }
        that.setData({
          comments: commentArr,
          commentNums: res.num,
          loadPage: that.data.loadPage + 1
        })
      }

    });
  },
  scrollPageTop: function () {
    app.pageScrollTo(0);
  },
  clickCommentLabel: function(e){
    var commentType = e.currentTarget.dataset.type,
        data = {};

    data.loadPage = 1;
    data.commnetType = commentType;

    this.setData(data);
    this.getAssessList(commentType, 1);
  },
  scrollLoadComment: function(){
    console.log('getmore');
    this.getAssessList(this.data.commentType, this.data.loadPage, 1);
  },
  clickPlusImages:function(e){
    wx.previewImage({
      current: e.currentTarget.dataset.src,
      urls: e.currentTarget.dataset.srcarr
    })
  },
  onReachBottom: function (e) {
    this.getAssessList(this.data.commentType, this.data.loadPage, 1);
  },
})
