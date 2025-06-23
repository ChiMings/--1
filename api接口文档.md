# 校园闲置交易平台 API 接口文档

## 1. 设计原则与规范

### 1.1 基本信息
- **Base URL**: `http://localhost:8080/api`
- **请求方法**: 主要使用 `GET` 和 `POST` 方法
- **认证方式**: JWT Token，在请求头中添加 `Authorization: Bearer <token>`
- **数据格式**: 所有请求和响应体均使用 `JSON` 格式
- **字符编码**: UTF-8

### 1.2 通用响应格式
```json
{
  "code": 200,
  "message": "success",
  "data": {
    // 具体数据内容
  }
}
```

### 1.3 状态码规范
- `200 OK`: 请求成功
- `201 Created`: 资源创建成功
- `400 Bad Request`: 请求参数错误
- `401 Unauthorized`: 未认证或Token无效
- `403 Forbidden`: 已认证但无权限访问
- `404 Not Found`: 请求的资源不存在
- `409 Conflict`: 资源冲突（如重复创建）
- `500 Internal Server Error`: 服务器内部错误

### 1.4 分页响应格式
```json
{
  "items": [
    // 数据项列表
  ],
  "total": 100,
  "page": 1,
  "limit": 20,
  "totalPages": 5
}
```

---

## 2. 认证模块 (Auth)

### 2.1 用户登录
**功能**: 支持认证用户密码登录和未认证用户姓名登录

**请求**:
- **方法**: `POST`
- **路径**: `/api/auth/login`
- **Content-Type**: `application/json`

**请求体**:
```json
// 认证用户登录
{
  "studentId": "20210001",
  "password": "user_password123"
}

// 或者未认证用户登录（游客登录）
{
  "studentId": "20210001",
  "name": "张三"
}
```

**响应 (200 OK)**:
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "studentId": "20210001",
      "name": "张三",
      "nickname": "技术宅",
      "contact": "13800138001",
      "role": "认证用户",
      "avatar": null,
      "createdAt": "2023-10-01T12:00:00Z"
    }
  }
}
```

**错误响应**:
```json
// 404 - 学号不存在
{
  "code": 404,
  "message": "学号不存在，请检查学号是否正确或联系管理员"
}

// 401 - 密码错误
{
  "code": 401,
  "message": "密码错误，请检查密码或使用忘记密码功能"
}

// 403 - 账号被禁用
{
  "code": 403,
  "message": "账号被禁用，请联系管理员"
}
```

### 2.2 账号激活
**功能**: 首次使用的用户通过学工号、姓名、激活码激活账号并设置密码

**请求**:
- **方法**: `POST`
- **路径**: `/api/auth/activate`
- **Content-Type**: `application/json`

**请求体**:
```json
{
  "studentId": "20210001",
  "name": "张三",
  "activationCode": "ABC123DEF456",
  "password": "new_password123",
  "nickname": "阿三"
}
```

**响应 (200 OK)**:
```json
{
  "code": 200,
  "message": "账号激活成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "studentId": "20210001",
      "name": "张三",
      "nickname": "阿三",
      "contact": null,
      "role": "认证用户",
      "avatar": null,
      "createdAt": "2023-11-15T10:00:00Z"
    }
  }
}
```

**错误响应**:
```json
// 400 - 激活码无效
{
  "code": 400,
  "message": "激活码无效或已过期，请检查激活码是否正确"
}

// 404 - 学号不存在或姓名不匹配
{
  "code": 404,
  "message": "学号不存在或姓名不匹配，请检查信息是否正确"
}

// 409 - 账号已激活
{
  "code": 409,
  "message": "该账号已激活，请直接使用认证登录"
}
```

### 2.3 忘记密码 - 请求重置码
**功能**: 用户忘记密码时，请求发送重置码

**请求**:
- **方法**: `POST`
- **路径**: `/api/auth/forgot-password/request`
- **Content-Type**: `application/json`

**请求体**:
```json
{
  "studentId": "20210001"
}
```

**响应 (200 OK)**:
```json
{
  "code": 200,
  "message": "密码重置码已发送，请注意查收"
}
```

### 2.4 忘记密码 - 重置密码
**功能**: 使用重置码设置新密码

**请求**:
- **方法**: `POST`
- **路径**: `/api/auth/forgot-password/reset`
- **Content-Type**: `application/json`

**请求体**:
```json
{
  "studentId": "20210001",
  "resetCode": "RESET123456",
  "newPassword": "brand_new_password123"
}
```

**响应 (200 OK)**:
```json
{
  "code": 200,
  "message": "密码重置成功"
}
```

---

## 3. 用户模块 (Users)

### 3.1 获取当前用户信息
**功能**: 获取当前登录用户的详细信息

**请求**:
- **方法**: `GET`
- **路径**: `/api/users/me`
- **认证**: 需要Token

**响应 (200 OK)**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "studentId": "20210001",
    "name": "张三",
    "nickname": "技术宅",
    "contact": "13800138001",
    "role": "认证用户",
    "avatar": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA...",
    "createdAt": "2023-10-01T12:00:00Z"
  }
}
```

### 3.2 更新个人信息
**功能**: 更新当前用户的个人信息

**请求**:
- **方法**: `POST`
- **路径**: `/api/users/me/update`
- **认证**: 需要Token
- **Content-Type**: `application/json`

**请求体**:
```json
{
  "nickname": "新昵称",
  "contact": "13900139000",
  "avatar": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA..."
}
```

**响应 (200 OK)**:
```json
{
  "code": 200,
  "message": "个人信息更新成功",
  "data": {
    "id": 1,
    "studentId": "20210001",
    "name": "张三",
    "nickname": "新昵称",
    "contact": "13900139000",
    "role": "认证用户",
    "avatar": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA...",
    "createdAt": "2023-10-01T12:00:00Z"
  }
}
```

### 3.3 获取指定用户信息
**功能**: 获取指定用户的公开信息（用于用户主页）

**请求**:
- **方法**: `GET`
- **路径**: `/api/users/{userId}`
- **认证**: 可选

**响应 (200 OK)**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "nickname": "技术宅",
    "role": "认证用户",
    "avatar": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA...",
    "createdAt": "2023-10-01T12:00:00Z",
    "stats": {
      "totalProducts": 5,
      "activeProducts": 3
    }
  }
}
```

### 3.4 获取指定用户发布的商品
**功能**: 查看某个用户发布的商品列表

**请求**:
- **方法**: `GET`
- **路径**: `/api/users/{userId}/products`
- **认证**: 可选
- **查询参数**:
  - `page`: 页码 (默认1)
  - `limit`: 每页数量 (默认20)
  - `status`: 商品状态 (`在售`、`已售出`)
  - `sortBy`: 排序字段 (`createdAt`、`price`)
  - `order`: 排序方式 (`asc`、`desc`)

**响应**: 参考商品列表响应格式

### 3.5 获取我收藏的商品
**功能**: 获取当前用户收藏的商品列表

**请求**:
- **方法**: `GET`
- **路径**: `/api/users/me/favorites`
- **认证**: 需要Token
- **查询参数**:
  - `page`: 页码 (默认1)
  - `limit`: 每页数量 (默认20)

**响应**: 参考商品列表响应格式

---

## 4. 商品模块 (Products)

### 4.1 获取商品列表
**功能**: 获取商品列表，支持搜索、筛选、排序和分页

**请求**:
- **方法**: `GET`
- **路径**: `/api/products`
- **认证**: 可选
- **查询参数**:
  - `page`: 页码 (默认1)
  - `limit`: 每页数量 (默认20)
  - `keyword`: 搜索关键词
  - `categoryId`: 分类ID
  - `status`: 商品状态 (`在售`、`已售出`)
  - `sortBy`: 排序字段 (`createdAt`、`price`)
  - `order`: 排序方式 (`asc`、`desc`，默认`desc`)

**响应 (200 OK)**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "name": "九成新罗技鼠标 MX Master 3",
        "description": "用了一年，手感很好，换新的了故出...",
        "price": 200,
        "categoryId": 1,
        "category": {
          "id": 1,
          "name": "数码产品"
        },
        "status": "在售",
        "images": [
          "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400"
        ],
        "seller": {
          "id": 1,
          "nickname": "技术宅"
        },
        "isFavorite": false,
        "createdAt": "2023-11-01T10:00:00Z"
      }
    ],
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

### 4.2 获取商品详情
**功能**: 获取单个商品的详细信息

**请求**:
- **方法**: `GET`
- **路径**: `/api/products/{productId}`
- **认证**: 可选

**响应 (200 OK)**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "name": "九成新罗技鼠标 MX Master 3",
    "description": "用了一年，手感很好，换新的了故出。原价499，现在只要200。功能完好，无损坏。",
    "price": 200,
    "categoryId": 1,
    "category": {
      "id": 1,
      "name": "数码产品"
    },
    "contact": "QQ: 123456789",
    "status": "在售",
    "images": [
      "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400",
      "https://images.unsplash.com/photo-1615750185084-c7b0b6fd7269?w=400"
    ],
    "seller": {
      "id": 1,
      "nickname": "技术宅",
      "avatar": null
    },
    "isFavorite": false,
    "createdAt": "2023-11-01T10:00:00Z"
  }
}
```

**注意**: `contact` 字段仅在用户已认证时返回

### 4.3 发布新商品
**功能**: 认证用户发布新商品

**请求**:
- **方法**: `POST`
- **路径**: `/api/products/create`
- **认证**: 需要Token
- **Content-Type**: `application/json`

**请求体**:
```json
{
  "name": "九成新罗技鼠标",
  "description": "用了一年，手感很好，换新的了故出。",
  "price": 200,
  "categoryId": 1,
  "contact": "QQ: 123456789",
  "images": [
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABA...",
    "https://example.com/image2.jpg"
  ]
}
```

**响应 (201 Created)**:
```json
{
  "code": 201,
  "message": "商品发布成功",
  "data": {
    "id": 123,
    "name": "九成新罗技鼠标",
    "description": "用了一年，手感很好，换新的了故出。",
    "price": 200,
    "categoryId": 1,
    "category": {
      "id": 1,
      "name": "数码产品"
    },
    "contact": "QQ: 123456789",
    "status": "在售",
    "images": [
      "https://api.example.com/uploads/image1.jpg"
    ],
    "seller": {
      "id": 1,
      "nickname": "技术宅"
    },
    "isFavorite": false,
    "createdAt": "2023-11-15T10:00:00Z"
  }
}
```

### 4.4 更新商品信息
**功能**: 商品发布者修改商品信息

**请求**:
- **方法**: `POST`
- **路径**: `/api/products/{productId}/update`
- **认证**: 需要Token (且为发布者本人)
- **Content-Type**: `application/json`

**请求体**: 包含要更新的字段
```json
{
  "name": "更新后的商品名称",
  "description": "更新后的描述",
  "price": 180,
  "categoryId": 2,
  "contact": "微信: new_contact"
}
```

**响应 (200 OK)**: 返回更新后的完整商品信息

### 4.5 更新商品状态
**功能**: 发布者将商品状态从"在售"改为"已售出"

**请求**:
- **方法**: `POST`
- **路径**: `/api/products/{productId}/status`
- **认证**: 需要Token (且为发布者本人)
- **Content-Type**: `application/json`

**请求体**:
```json
{
  "status": "已售出"
}
```

**响应 (200 OK)**:
```json
{
  "code": 200,
  "message": "商品状态更新成功",
  "data": {
    "id": 1,
    "status": "已售出",
    "soldAt": "2023-11-15T14:30:00Z"
  }
}
```

### 4.6 删除商品
**功能**: 发布者删除自己的商品

**请求**:
- **方法**: `POST`
- **路径**: `/api/products/{productId}/delete`
- **认证**: 需要Token (且为发布者本人)

**响应 (200 OK)**:
```json
{
  "code": 200,
  "message": "商品删除成功"
}
```

### 4.7 收藏商品
**功能**: 用户收藏/取消收藏商品

**请求**:
- **方法**: `POST`
- **路径**: `/api/products/{productId}/favorite`
- **认证**: 需要Token

**响应 (200 OK)**:
```json
{
  "code": 200,
  "message": "收藏成功"
}
```

### 4.8 取消收藏商品
**请求**:
- **方法**: `POST`
- **路径**: `/api/products/{productId}/unfavorite`
- **认证**: 需要Token

**响应 (200 OK)**:
```json
{
  "code": 200,
  "message": "取消收藏成功"
}
```

### 4.9 获取商品分类
**功能**: 获取所有商品分类列表

**请求**:
- **方法**: `GET`
- **路径**: `/api/categories`
- **认证**: 不需要

**响应 (200 OK)**:
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 1,
      "name": "数码产品",
      "icon": "📱",
      "description": "手机、电脑、平板等数码设备",
      "isActive": true,
      "productCount": 45,
      "sortOrder": 10
    },
    {
      "id": 2,
      "name": "学习用品",
      "icon": "📚",
      "description": "教材、文具、学习资料等",
      "isActive": true,
      "productCount": 32,
      "sortOrder": 9
    }
  ]
}
```

---

## 5. 评论模块 (Comments)

### 5.1 获取商品评论
**功能**: 获取指定商品的评论列表

**请求**:
- **方法**: `GET`
- **路径**: `/api/products/{productId}/comments`
- **认证**: 可选
- **查询参数**:
  - `page`: 页码 (默认1)
  - `limit`: 每页数量 (默认20)

**响应 (200 OK)**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "content": "这个还在吗？",
        "author": {
          "id": 3,
          "nickname": "买家小李",
          "avatar": null
        },
        "createdAt": "2023-10-02T10:00:00Z"
      },
      {
        "id": 2,
        "content": "最低多少钱？",
        "author": {
          "id": 4,
          "nickname": "询价用户",
          "avatar": null
        },
        "createdAt": "2023-10-03T15:20:00Z"
      }
    ],
    "total": 2,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

### 5.2 发表评论
**功能**: 在商品下发表评论

**请求**:
- **方法**: `POST`
- **路径**: `/api/products/{productId}/comments/create`
- **认证**: 需要Token
- **Content-Type**: `application/json`

**请求体**:
```json
{
  "content": "最低多少钱？"
}
```

**响应 (201 Created)**:
```json
{
  "code": 201,
  "message": "评论发表成功",
  "data": {
    "id": 123,
    "content": "最低多少钱？",
    "author": {
      "id": 1,
      "nickname": "技术宅",
      "avatar": null
    },
    "createdAt": "2023-11-15T10:00:00Z"
  }
}
```

### 5.3 删除评论
**功能**: 用户删除自己的评论

**请求**:
- **方法**: `POST`
- **路径**: `/api/comments/{commentId}/delete`
- **认证**: 需要Token (且为评论者本人)

**响应 (200 OK)**:
```json
{
  "code": 200,
  "message": "评论删除成功"
}
```

---

## 6. 私信模块 (Messages)

### 6.1 获取会话列表
**功能**: 获取当前用户的私信会话列表

**请求**:
- **方法**: `GET`
- **路径**: `/api/messages`
- **认证**: 需要Token
- **查询参数**:
  - `page`: 页码 (默认1)
  - `limit`: 每页数量 (默认20)

**响应 (200 OK)**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": "conversation_1",
        "otherUser": {
          "id": 2,
          "nickname": "书虫",
          "avatar": null
        },
        "lastMessage": {
          "content": "商品还在吗？",
          "sentAt": "2023-11-15T09:30:00Z",
          "senderId": 2
        },
        "unreadCount": 3,
        "updatedAt": "2023-11-15T09:30:00Z"
      }
    ],
    "total": 5,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

### 6.2 获取与指定用户的消息记录
**功能**: 获取与某个用户的聊天记录

**请求**:
- **方法**: `GET`
- **路径**: `/api/messages/{userId}`
- **认证**: 需要Token
- **查询参数**:
  - `page`: 页码 (默认1)
  - `limit`: 每页数量 (默认50)

**响应 (200 OK)**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "otherUser": {
      "id": 2,
      "nickname": "书虫",
      "avatar": null
    },
    "messages": [
      {
        "id": "msg_1",
        "content": "你好，这个商品还在吗？",
        "senderId": 2,
        "receiverId": 1,
        "sentAt": "2023-11-15T09:30:00Z",
        "isRead": true
      },
      {
        "id": "msg_2",
        "content": "在的，你可以来看看",
        "senderId": 1,
        "receiverId": 2,
        "sentAt": "2023-11-15T09:35:00Z",
        "isRead": false
      }
    ],
    "total": 15,
    "page": 1,
    "limit": 50,
    "totalPages": 1
  }
}
```

### 6.3 发送私信
**功能**: 向指定用户发送私信

**请求**:
- **方法**: `POST`
- **路径**: `/api/messages/send`
- **认证**: 需要Token
- **Content-Type**: `application/json`

**请求体**:
```json
{
  "receiverId": 2,
  "content": "你好，我对你的商品很感兴趣"
}
```

**响应 (201 Created)**:
```json
{
  "code": 201,
  "message": "消息发送成功",
  "data": {
    "id": "msg_123",
    "content": "你好，我对你的商品很感兴趣",
    "senderId": 1,
    "receiverId": 2,
    "sentAt": "2023-11-15T10:00:00Z",
    "isRead": false
  }
}
```

### 6.4 标记消息为已读
**功能**: 将与某用户的未读消息标记为已读

**请求**:
- **方法**: `POST`
- **路径**: `/api/messages/{userId}/read`
- **认证**: 需要Token

**响应 (200 OK)**:
```json
{
  "code": 200,
  "message": "消息已标记为已读"
}
```

---

## 7. 通知模块 (Notifications)

### 7.1 获取通知列表
**功能**: 获取当前用户的通知列表

**请求**:
- **方法**: `GET`
- **路径**: `/api/notifications`
- **认证**: 需要Token
- **查询参数**:
  - `page`: 页码 (默认1)
  - `limit`: 每页数量 (默认20)

**响应 (200 OK)**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": "notif_1",
        "type": "NEW_COMMENT",
        "title": "新评论",
        "content": "用户 '书虫' 评论了您的商品 '九成新罗技鼠标'",
        "isRead": false,
        "relatedData": {
          "productId": 1,
          "commentId": 5
        },
        "createdAt": "2023-11-15T10:00:00Z"
      },
      {
        "id": "notif_2",
        "type": "NEW_MESSAGE",
        "title": "新私信",
        "content": "用户 '运动达人' 向您发送了私信",
        "isRead": true,
        "relatedData": {
          "senderId": 3
        },
        "createdAt": "2023-11-14T15:30:00Z"
      }
    ],
    "total": 8,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

### 7.2 获取未读通知数
**功能**: 获取当前用户的未读通知总数

**请求**:
- **方法**: `GET`
- **路径**: `/api/notifications/unread-count`
- **认证**: 需要Token

**响应 (200 OK)**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "count": 5
  }
}
```

### 7.3 标记通知为已读
**功能**: 标记单条或所有通知为已读

**请求**:
- **方法**: `POST`
- **路径**: `/api/notifications/read`
- **认证**: 需要Token
- **Content-Type**: `application/json`

**请求体**:
```json
// 标记单条通知为已读
{
  "notificationId": "notif_1"
}

// 或者标记所有通知为已读
{
  "readAll": true
}
```

**响应 (200 OK)**:
```json
{
  "code": 200,
  "message": "通知已标记为已读"
}
```

---

## 8. 举报模块 (Reports)

### 8.1 创建举报
**功能**: 用户举报商品或评论

**请求**:
- **方法**: `POST`
- **路径**: `/api/reports/create`
- **认证**: 需要Token
- **Content-Type**: `application/json`

**请求体**:
```json
{
  "type": "product", // 或 "comment" 或 "user"
  "targetId": 123,   // 被举报对象的ID
  "reason": "虚假信息",
  "description": "该商品描述与实际不符，涉嫌欺诈"
}
```

**响应 (201 Created)**:
```json
{
  "code": 201,
  "message": "举报提交成功，我们会尽快处理",
  "data": {
    "id": "report_123",
    "type": "product",
    "targetId": 123,
    "reason": "虚假信息",
    "description": "该商品描述与实际不符，涉嫌欺诈",
    "status": "待处理",
    "createdAt": "2023-11-15T10:00:00Z"
  }
}
```

---

## 9. 后台管理模块 (Admin)

**注意**: 所有后台管理接口都需要管理员或超级管理员权限

### 9.1 获取数据统计
**功能**: 获取平台数据统计信息

**请求**:
- **方法**: `GET`
- **路径**: `/api/admin/stats`
- **认证**: 需要Token (管理员权限)

**响应 (200 OK)**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "totalUsers": 1250,
    "totalProducts": 890,
    "activeProducts": 456,
    "totalComments": 3200,
    "totalReports": 12,
    "pendingReports": 3,
    "todayNewUsers": 5,
    "todayNewProducts": 15,
    "monthlyStats": {
      "users": [45, 52, 38, 65, 42, 58, 47],
      "products": [120, 135, 95, 178, 142, 165, 158]
    }
  }
}
```

### 9.2 用户管理

#### 9.2.1 获取用户列表
**请求**:
- **方法**: `GET`
- **路径**: `/api/admin/users`
- **认证**: 需要Token (管理员权限)
- **查询参数**:
  - `page`: 页码 (默认1)
  - `limit`: 每页数量 (默认20)
  - `keyword`: 搜索关键词 (学号、姓名、昵称)
  - `role`: 角色筛选
  - `status`: 状态筛选

**响应**: 用户列表（包含敏感信息，仅管理员可见）

#### 9.2.2 更新用户角色
**请求**:
- **方法**: `POST`
- **路径**: `/api/admin/users/{userId}/role/update`
- **认证**: 需要Token (超级管理员权限)
- **Content-Type**: `application/json`

**请求体**:
```json
{
  "role": "管理员" // 或其他角色
}
```

#### 9.2.3 禁用/启用用户
**请求**:
- **方法**: `POST`
- **路径**: `/api/admin/users/{userId}/status/update`
- **认证**: 需要Token (管理员权限)
- **Content-Type**: `application/json`

**请求体**:
```json
{
  "status": "禁用" // 或 "正常"
}
```

### 9.3 商品管理

#### 9.3.1 获取所有商品列表
**请求**:
- **方法**: `GET`
- **路径**: `/api/admin/products`
- **认证**: 需要Token (管理员权限)
- **查询参数**: 类似普通商品列表，但包含更多管理字段

#### 9.3.2 强制下架商品
**请求**:
- **方法**: `POST`
- **路径**: `/api/admin/products/{productId}/remove`
- **认证**: 需要Token (管理员权限)
- **Content-Type**: `application/json`

**请求体**:
```json
{
  "reason": "违规内容"
}
```

### 9.4 分类管理

#### 9.4.1 创建分类
**请求**:
- **方法**: `POST`
- **路径**: `/api/admin/categories/create`
- **认证**: 需要Token (管理员权限)
- **Content-Type**: `application/json`

**请求体**:
```json
{
  "name": "新分类名称",
  "icon": "🎯",
  "description": "分类描述",
  "sortOrder": 15
}
```

#### 9.4.2 更新分类
**请求**:
- **方法**: `POST`
- **路径**: `/api/admin/categories/{categoryId}/update`
- **认证**: 需要Token (管理员权限)

#### 9.4.3 删除分类
**请求**:
- **方法**: `POST`
- **路径**: `/api/admin/categories/{categoryId}/delete`
- **认证**: 需要Token (管理员权限)

### 9.5 举报管理

#### 9.5.1 获取举报列表
**请求**:
- **方法**: `GET`
- **路径**: `/api/admin/reports`
- **认证**: 需要Token (管理员权限)
- **查询参数**:
  - `page`: 页码
  - `limit`: 每页数量
  - `status`: 处理状态
  - `type`: 举报类型

**响应**: 举报详细信息列表

#### 9.5.2 处理举报
**请求**:
- **方法**: `POST`
- **路径**: `/api/admin/reports/{reportId}/process`
- **认证**: 需要Token (管理员权限)
- **Content-Type**: `application/json`

**请求体**:
```json
{
  "action": "approved", // 或 "rejected" 或 "resolved"
  "adminNote": "处理备注"
}
```

---

## 10. 公告模块 (Notices)

### 10.1 获取公告列表
**功能**: 获取平台公告列表

**请求**:
- **方法**: `GET`
- **路径**: `/api/notices`
- **认证**: 不需要
- **查询参数**:
  - `page`: 页码 (默认1)
  - `limit`: 每页数量 (默认10)

**响应 (200 OK)**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "title": "平台使用规范",
        "content": "为了维护良好的交易环境...",
        "type": "important", // 或 "normal"
        "isSticky": true,    // 是否置顶
        "publishedAt": "2023-11-01T10:00:00Z",
        "author": {
          "id": 2,
          "nickname": "管理员"
        }
      }
    ],
    "total": 5,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

### 10.2 获取公告详情
**请求**:
- **方法**: `GET`
- **路径**: `/api/notices/{noticeId}`
- **认证**: 不需要

### 10.3 创建公告 (管理员)
**请求**:
- **方法**: `POST`
- **路径**: `/api/admin/notices/create`
- **认证**: 需要Token (管理员权限)

---

## 11. 错误处理

### 11.1 常见错误响应格式
```json
{
  "code": 400,
  "message": "请求参数错误",
  "errors": [
    {
      "field": "price",
      "message": "价格必须大于0"
    }
  ]
}
```

### 11.2 认证错误
```json
{
  "code": 401,
  "message": "Token已过期，请重新登录"
}
```

### 11.3 权限错误
```json
{
  "code": 403,
  "message": "您没有权限执行此操作"
}
```

---

## 12. 开发说明

### 12.1 模拟数据模式
在开发环境中，前端可以通过配置 `useMockData: true` 使用模拟数据，无需连接真实后端。

### 12.2 文件上传
- 图片文件建议使用 Base64 编码在JSON中传输
- 支持的图片格式：JPG、PNG
- 单个图片大小限制：2MB
- 每个商品最多支持5张图片

### 12.3 实时功能
- 私信功能可考虑使用 WebSocket 实现实时通讯
- 通知功能可使用服务器推送 (SSE) 或 WebSocket

### 12.4 安全考虑
- 所有用户输入都需要进行严格的验证和过滤
- 图片上传需要检查文件类型和大小
- 敏感信息（如联系方式）只对认证用户显示
- 实施频率限制防止恶意请求

---

## 13. 版本信息

- **文档版本**: v2.0
- **最后更新**: 2023年11月15日
- **兼容的前端版本**: v1.0+
