# 校园二手交易平台 API 接口文档

## 1. 设计原则

- **Base URL**: `/api`
- **请求方法**: 所有接口仅使用 `GET` 和 `POST` 方法。
- **认证**: 需要认证的接口，需在请求头中加入 `Authorization: Bearer <token>`。`token` 在用户登录或激活后获得。
- **数据格式**: 所有请求和响应体均使用 `JSON` 格式。
- **状态码**:
    - `200 OK`: 请求成功。
    - `201 Created`: 资源创建成功。
    - `400 Bad Request`: 请求参数错误。
    - `401 Unauthorized`: 未认证或Token无效。
    - `403 Forbidden`: 已认证，但无权访问。
    - `404 Not Found`: 请求的资源不存在。
    - `500 Internal Server Error`: 服务器内部错误。

---

## 2. 认证模块 (Auth)

### 2.1. 账号激活

- **功能**: 用户首次使用，通过学工号、姓名、激活码激活账号并设置密码。
- **方法**: `POST`
- **路径**: `/api/auth/activate`
- **请求体**:
  ```json
  {
    "studentId": "20210001",
    "name": "张三",
    "activationCode": "UNIQUE-CODE-123",
    "password": "new_password_123",
    "nickname": "阿三"
  }
  ```
- **响应 (200 OK)**:
  ```json
  {
    "token": "jwt_token_string",
    "user": {
      "id": 1,
      "nickname": "阿三",
      "role": "认证用户"
    }
  }
  ```

### 2.2. 登录

- **功能**: 支持学工号+密码（认证用户）或学工号+姓名（未认证用户）登录。
- **方法**: `POST`
- **路径**: `/api/auth/login`
- **请求体**:
  ```json
  {
    "studentId": "20210001",
    "password": "user_password" 
    // 或者 "name": "张三"
  }
  ```
- **响应 (200 OK)**:
  ```json
  {
    "token": "jwt_token_string",
    "user": {
      "id": 1,
      "nickname": "阿三",
      "role": "认证用户" // 或 "未认证用户"
    }
  }
  ```

### 2.3. 密码重置

- **功能**: 用户忘记密码时，请求发送重置码到其联系方式，并使用重置码设置新密码。
- **方法**: `POST`
- **路径**: `/api/auth/forgot-password/request`
- **请求体**:
  ```json
  {
    "studentId": "20210001"
  }
  ```
- **响应 (200 OK)**:
  ```json
  {
    "message": "密码重置码已发送，请注意查收。"
  }
  ```

- **功能**: 使用重置码设置新密码。
- **方法**: `POST`
- **路径**: `/api/auth/forgot-password/reset`
- **请求体**:
  ```json
  {
    "studentId": "20210001",
    "resetCode": "RESET-CODE-456",
    "newPassword": "a_brand_new_password"
  }
  ```
- **响应 (200 OK)**:
  ```json
  {
    "message": "密码重置成功。"
  }
  ```

---

## 3. 用户模块 (Users)

### 3.1. 获取当前用户信息

- **功能**: 获取当前登录用户的详细信息。
- **认证**: 需要
- **方法**: `GET`
- **路径**: `/api/users/me`
- **响应 (200 OK)**:
  ```json
  {
    "id": 1,
    "studentId": "20210001",
    "name": "张三",
    "nickname": "阿三",
    "contact": "13800138000",
    "role": "认证用户",
    "credit": 100,
    "createdAt": "2023-10-01T12:00:00Z"
  }
  ```

### 3.2. 更新个人信息

- **功能**: 更新昵称、联系方式等。
- **认证**: 需要
- **方法**: `POST`
- **路径**: `/api/users/me/update`
- **请求体**:
  ```json
  {
    "nickname": "新的昵称",
    "contact": "13900139000"
  }
  ```
- **响应 (200 OK)**: 返回更新后的用户信息。

### 3.3. 获取指定用户发布的商品

- **功能**: 查看某个用户（包括自己）发布的所有商品。
- **认证**: 可选
- **方法**: `GET`
- **路径**: `/api/users/{userId}/products`
- **说明**: 路径中的 `{userId}` 可以是具体的用户ID，也可以是 `me`，代表当前登录的用户。
- **响应 (200 OK)**: 返回商品列表的结构，与 `GET /api/products` 类似。

### 3.4. 获取指定用户的信用评价

- **功能**: 查看某个用户（包括自己）收到的所有信用评价。
- **认证**: 可选
- **方法**: `GET`
- **路径**: `/api/users/{userId}/ratings`
- **说明**: 路径中的 `{userId}` 可以是具体的用户ID，也可以是 `me`，代表当前登录的用户。
- **响应 (200 OK)**:
  ```json
  {
    "items": [
        {
            "id": 1,
            "rating": "good",
            "comment": "卖家很棒！",
            "rater": { "id": 4, "nickname": "买家C" },
            "createdAt": "2023-10-10T14:00:00Z"
        }
    ],
    "total": 1
  }
  ```

---

## 4. 商品模块 (Products)

### 4.1. 获取商品列表（带筛选和搜索）

- **功能**: 浏览全站商品，可按分类、关键词、状态筛选，可排序。
- **认证**: 可选
- **方法**: `GET`
- **路径**: `/api/products`
- **查询参数**:
  - `page` (页码, e.g., `1`)
  - `limit` (每页数量, e.g., `20`)
  - `categoryId` (分类ID)
  - `keyword` (搜索关键词)
  - `status` (状态: `在售`, `已售出`)
  - `sortBy` (排序字段: `createdAt`, `price`)
  - `order` (排序方式: `asc`, `desc`)
- **响应 (200 OK)**:
  ```json
  {
    "items": [
      // 商品对象列表...
    ],
    "total": 100,
    "page": 1,
    "limit": 20
  }
  ```

### 4.2. 发布新商品

- **功能**: 认证用户发布新商品。
- **认证**: 需要
- **方法**: `POST`
- **路径**: `/api/products/create`
- **请求体**: (建议使用 `multipart/form-data` 以便上传图片)
  ```json
  {
    "name": "九成新罗技鼠标",
    "description": "用了一年，手感很好，换新的了故出。",
    "price": 50,
    "categoryId": 3,
    "contact": "QQ: 123456",
    "images": ["image_file_1.jpg", "image_file_2.jpg"]
  }
  ```
- **响应 (201 Created)**: 返回创建的商品详情。

### 4.3. 获取商品详情

- **功能**: 查看单个商品的详细信息。
- **认证**: 可选
- **方法**: `GET`
- **路径**: `/api/products/{productId}`
- **响应 (200 OK)**:
  ```json
  {
    "id": 1,
    "name": "九成新罗技鼠标",
    // ... 其他字段
    "contact": "QQ: 123456", // 注意: 此字段仅在请求者为"认证用户"时返回
    "seller": {
      "id": 2,
      "nickname": "卖家A",
      "credit": 105
    },
    "isFavorite": true // 如果已登录，显示当前用户是否收藏
  }
  ```

### 4.4. 更新商品信息

- **功能**: 商品发布者修改自己的商品信息。
- **认证**: 需要 (且为发布者本人)
- **方法**: `POST`
- **路径**: `/api/products/{productId}/update`
- **请求体**: 包含要更新的字段。
- **响应 (200 OK)**: 返回更新后的商品详情。

### 4.5. 更新商品状态

- **功能**: 发布者将商品状态从"在售"改为"已售出"。
- **认证**: 需要 (且为发布者本人)
- **方法**: `POST`
- **路径**: `/api/products/{productId}/status`
- **请求体**:
  ```json
  {
    "status": "已售出"
  }
  ```
- **响应 (200 OK)**: 返回更新后的商品详情。

### 4.6. 删除商品

- **功能**: 发布者删除自己的商品。
- **认证**: 需要 (且为发布者本人)
- **方法**: `POST`
- **路径**: `/api/products/{productId}/delete`
- **响应 (200 OK)**

---

## 5. 评论模块 (Comments)

### 5.1. 获取商品评论

- **功能**: 查看指定商品下的所有评论。
- **认证**: 可选
- **方法**: `GET`
- **路径**: `/api/products/{productId}/comments`
- **响应 (200 OK)**:
  ```json
  {
    "items": [
      {
        "id": 1,
        "content": "这个还在吗？",
        "author": { "id": 3, "nickname": "评论者B" },
        "createdAt": "2023-10-02T10:00:00Z"
      }
    ],
    "total": 1
  }
  ```

### 5.2. 发表评论

- **功能**: 认证用户在商品下发表评论。
- **认证**: 需要
- **方法**: `POST`
- **路径**: `/api/products/{productId}/comments/create`
- **请求体**:
  ```json
  {
    "content": "最低多少钱？"
  }
  ```
- **响应 (201 Created)**: 返回创建的评论内容。

### 5.3. 删除评论

- **功能**: 用户删除自己的评论。
- **认证**: 需要 (且为评论者本人)
- **方法**: `POST`
- **路径**: `/api/comments/{commentId}/delete`
- **响应 (200 OK)**

---

## 6. 其他模块（私信、收藏、分类、举报、评价）

### 6.1. 私信
- `POST /api/messages/send`: 发送私信 (需要认证)
- `GET /api/messages`: 获取我的私信会话列表 (需要认证)
- `GET /api/messages/{userId}`: 获取我与某用户的具体消息记录 (需要认证)

### 6.2. 收藏
- `POST /api/products/{productId}/favorite`: 收藏商品 (需要认证)
- `POST /api/products/{productId}/unfavorite`: 取消收藏 (需要认证)
- `GET /api/users/me/favorites`: 获取我收藏的商品列表 (需要认证)

### 6.3. 分类
- `GET /api/categories`: 获取所有商品分类列表

### 6.4. 举报
- `POST /api/reports/create`: 创建一个举报 (需要认证)
  - 请求体: `{ "type": "product" | "comment", "targetId": 123, "reason": "举报原因" }`

### 6.5. 信用评价
- `POST /api/ratings/create`: 对一笔完成的交易进行评价 (需要认证)
  - 请求体: `{ "tradeId": 456, "targetUserId": 2, "rating": "good", "comment": "卖家很棒！" }`

---

## 7. 后台管理模块 (Admin)

**注意**: 所有后台管理接口都需要**管理员**或**超级管理员**权限。

### 7.1. 数据看板
- `GET /api/admin/stats`: 获取统计数据。

### 7.2. 用户管理
- `GET /api/admin/users`: 获取用户列表。
- `POST /api/admin/users/{userId}/role/update`: 更新用户角色 (**超级管理员**权限)。

### 7.3. 商品管理
- `GET /api/admin/products`: 获取所有商品列表。
- `POST /api/admin/products/{productId}/delete`: (强制)下架/删除商品（执行软删除，将商品标记为不可见，而非物理删除）。

### 7.4. 分类管理
- `POST /api/admin/categories/create`: 新增分类。
- `POST /api/admin/categories/{categoryId}/update`: 修改分类。
- `POST /api/admin/categories/{categoryId}/delete`: 删除分类。

### 7.5. 评论管理
- `POST /api/admin/comments/{commentId}/delete`: 删除任意评论。

### 7.6. 举报管理
- `GET /api/admin/reports`: 查看举报列表。
- `POST /api/admin/reports/{reportId}/process`: 处理举报（如标记为已处理）。

---

## 8. 消息通知模块 (Notifications)

**注意**: 所有通知接口都需要**认证**。

### 8.1. 获取通知列表
- **功能**: 获取当前用户的消息通知列表，支持分页。
- **方法**: `GET`
- **路径**: `/api/notifications`
- **查询参数**:
  - `page` (页码, e.g., `1`)
  - `limit` (每页数量, e.g., `10`)
- **响应 (200 OK)**:
  ```json
  {
    "items": [
      {
        "id": "notification_id_1",
        "type": "NEW_COMMENT",
        "content": "用户 B 评论了您的商品 '九成新罗技鼠标'",
        "isRead": false,
        "createdAt": "2023-10-11T10:00:00Z"
      }
    ],
    "total": 1
  }
  ```

### 8.2. 获取未读通知数
- **功能**: 获取当前用户的未读消息总数。
- **方法**: `GET`
- **路径**: `/api/notifications/unread-count`
- **响应 (200 OK)**:
  ```json
  {
    "count": 5
  }
  ```

### 8.3. 标记通知为已读
- **功能**: 将单条或所有通知标记为已读。
- **方法**: `POST`
- **路径**: `/api/notifications/read`
- **请求体**:
  ```json
  {
    "notificationId": "notification_id_1" 
    // 或者 "readAll": true
  }
  ```
- **响应 (200 OK)**
