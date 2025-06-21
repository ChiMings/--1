#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
校园二手交易平台 API 测试脚本
测试所有API接口的功能和响应
"""

import requests
import json
import time
from typing import Dict, Any, Optional
from colorama import Fore, Style, init

# 初始化colorama
init(autoreset=True)

class APITester:
    def __init__(self, base_url: str = "http://localhost:3000"):
        self.base_url = base_url
        self.session = requests.Session()
        self.token = None
        self.test_results = []
        
    def log_success(self, message: str):
        """打印成功消息"""
        print(f"{Fore.GREEN}✅ {message}{Style.RESET_ALL}")
        
    def log_error(self, message: str):
        """打印错误消息"""
        print(f"{Fore.RED}❌ {message}{Style.RESET_ALL}")
        
    def log_info(self, message: str):
        """打印信息消息"""
        print(f"{Fore.CYAN}ℹ️  {message}{Style.RESET_ALL}")
        
    def log_warning(self, message: str):
        """打印警告消息"""
        print(f"{Fore.YELLOW}⚠️  {message}{Style.RESET_ALL}")

    def make_request(self, method: str, endpoint: str, data: Optional[Dict] = None, 
                    headers: Optional[Dict] = None, params: Optional[Dict] = None) -> Dict[str, Any]:
        """发起HTTP请求"""
        url = f"{self.base_url}{endpoint}"
        
        # 设置默认headers
        default_headers = {"Content-Type": "application/json"}
        if self.token:
            default_headers["Authorization"] = f"Bearer {self.token}"
        
        if headers:
            default_headers.update(headers)
            
        try:
            if method.upper() == "GET":
                response = self.session.get(url, headers=default_headers, params=params)
            elif method.upper() == "POST":
                response = self.session.post(url, headers=default_headers, json=data, params=params)
            elif method.upper() == "PUT":
                response = self.session.put(url, headers=default_headers, json=data, params=params)
            elif method.upper() == "DELETE":
                response = self.session.delete(url, headers=default_headers, params=params)
            else:
                raise ValueError(f"不支持的HTTP方法: {method}")
                
            return {
                "status_code": response.status_code,
                "data": response.json() if response.content else {},
                "success": 200 <= response.status_code < 300
            }
        except requests.exceptions.ConnectionError:
            return {
                "status_code": 0,
                "data": {"error": "连接失败，服务器可能未启动"},
                "success": False
            }
        except Exception as e:
            return {
                "status_code": 0,
                "data": {"error": str(e)},
                "success": False
            }

    def test_endpoint(self, name: str, method: str, endpoint: str, 
                     data: Optional[Dict] = None, expected_status: int = 200,
                     params: Optional[Dict] = None, headers: Optional[Dict] = None) -> bool:
        """测试单个API端点"""
        self.log_info(f"测试: {name}")
        result = self.make_request(method, endpoint, data, headers=headers, params=params)
        
        if result["status_code"] == 0:
            self.log_error(f"{name} - {result['data']['error']}")
            self.test_results.append({"name": name, "status": "FAILED", "error": result['data']['error']})
            return False
            
        if result["success"] and result["status_code"] == expected_status:
            self.log_success(f"{name} - 状态码: {result['status_code']}")
            self.test_results.append({"name": name, "status": "PASSED", "status_code": result['status_code']})
            return True
        else:
            error_msg = result['data'].get('message', '未知错误')
            self.log_error(f"{name} - 状态码: {result['status_code']}, 错误: {error_msg}")
            self.test_results.append({"name": name, "status": "FAILED", "status_code": result['status_code'], "error": error_msg})
            return False

    def test_health_check(self):
        """测试健康检查"""
        print(f"\n{Fore.BLUE}{'='*50}")
        print(f"1. 基础功能测试")
        print(f"{'='*50}{Style.RESET_ALL}")
        
        self.test_endpoint("健康检查", "GET", "/health")
        self.test_endpoint("根路径", "GET", "/")

    def test_auth_module(self):
        """测试认证模块"""
        print(f"\n{Fore.BLUE}{'='*50}")
        print(f"2. 认证模块测试 (/api/auth)")
        print(f"{'='*50}{Style.RESET_ALL}")
        
        # 测试登录接口
        login_data = {
            "studentId": "20210001",
            "password": "password123"
        }
        result = self.make_request("POST", "/api/auth/login", login_data)
        if result["success"]:
            self.log_success("用户登录 - 成功")
            # 保存token用于后续测试
            if "data" in result["data"] and "token" in result["data"]["data"]:
                self.token = result["data"]["data"]["token"]
                self.log_info(f"获取到Token: {self.token[:20]}...")
        else:
            self.log_error(f"用户登录 - 失败: {result['data']}")
            
        # 测试账号激活
        activate_data = {
            "studentId": "20240002",
            "name": "测试用户",
            "activationCode": "TEST123",
            "password": "newpassword123",
            "nickname": "测试昵称"
        }
        self.test_endpoint("账号激活", "POST", "/api/auth/activate", activate_data)
        
        # 测试忘记密码
        forgot_data = {"studentId": "20240001"}
        self.test_endpoint("请求密码重置", "POST", "/api/auth/forgot-password", forgot_data)
        
        # 测试重置密码
        reset_data = {
            "studentId": "20240001",
            "resetCode": "RESET123",
            "newPassword": "newpassword456"
        }
        self.test_endpoint("重置密码", "POST", "/api/auth/reset-password", reset_data)

    def test_users_module(self):
        """测试用户模块"""
        print(f"\n{Fore.BLUE}{'='*50}")
        print(f"3. 用户模块测试 (/api/users)")
        print(f"{'='*50}{Style.RESET_ALL}")
        
        # 测试获取用户资料
        self.test_endpoint("获取用户资料", "GET", "/api/users/profile")
        
        # 测试更新用户资料
        update_data = {
            "nickname": "更新的昵称",
            "contact": "13900139000",
            "avatar": None
        }
        self.test_endpoint("更新用户资料", "PUT", "/api/users/profile", update_data)
        
        # 测试获取指定用户信息
        self.test_endpoint("获取指定用户信息", "GET", "/api/users/1")
        
        # 测试获取用户商品
        self.test_endpoint("获取用户商品", "GET", "/api/users/1/products")

    def test_products_module(self):
        """测试商品模块"""
        print(f"\n{Fore.BLUE}{'='*50}")
        print(f"4. 商品模块测试 (/api/products)")
        print(f"{'='*50}{Style.RESET_ALL}")
        
        # 测试获取商品列表
        self.test_endpoint("获取商品列表", "GET", "/api/products")
        
        # 测试带参数的商品列表
        params = {"page": 1, "limit": 10, "sortBy": "createdAt"}
        self.test_endpoint("获取商品列表(带参数)", "GET", "/api/products", params=params)
        
        # 测试发布商品
        product_data = {
            "name": "测试商品",
            "description": "这是一个测试商品",
            "price": 99.99,
            "categoryId": "cat1",
            "contact": "test@example.com",
            "images": ["test_image.jpg"]
        }
        result = self.make_request("POST", "/api/products", product_data)
        product_id = "1"  # 使用默认ID进行后续测试
        if result["success"]:
            self.log_success("发布商品 - 成功")
        else:
            self.log_error(f"发布商品 - 失败: {result['data']}")
        
        # 测试获取商品详情
        self.test_endpoint("获取商品详情", "GET", f"/api/products/{product_id}")
        
        # 测试更新商品
        update_product_data = {
            "name": "更新的商品名称",
            "price": 88.88
        }
        self.test_endpoint("更新商品", "PUT", f"/api/products/{product_id}", update_product_data)
        
        # 测试收藏商品
        self.test_endpoint("收藏商品", "POST", f"/api/products/{product_id}/favorite")
        
        # 测试取消收藏
        self.test_endpoint("取消收藏", "DELETE", f"/api/products/{product_id}/favorite")
        
        # 测试添加评论
        comment_data = {"content": "这是一条测试评论"}
        self.test_endpoint("添加评论", "POST", f"/api/products/{product_id}/comments", comment_data, 201)
        
        # 测试获取评论
        self.test_endpoint("获取商品评论", "GET", f"/api/products/{product_id}/comments")
        
        # 测试删除评论
        self.test_endpoint("删除评论", "DELETE", f"/api/products/{product_id}/comments/1")
        
        # 测试删除商品
        self.test_endpoint("删除商品", "DELETE", f"/api/products/{product_id}")

    def test_categories_module(self):
        """测试分类模块"""
        print(f"\n{Fore.BLUE}{'='*50}")
        print(f"5. 分类模块测试 (/api/categories)")
        print(f"{'='*50}{Style.RESET_ALL}")
        
        # 测试获取所有分类
        self.test_endpoint("获取所有分类", "GET", "/api/categories")
        
        # 测试创建分类
        category_data = {
            "name": "测试分类",
            "description": "这是一个测试分类",
            "icon": "test"
        }
        self.test_endpoint("创建分类", "POST", "/api/categories", category_data, 201)
        
        # 测试获取分类详情
        category_id = "cat1"
        self.test_endpoint("获取分类详情", "GET", f"/api/categories/{category_id}")
        
        # 测试更新分类
        update_category_data = {
            "name": "更新的分类名称",
            "description": "更新的描述"
        }
        self.test_endpoint("更新分类", "PUT", f"/api/categories/{category_id}", update_category_data)
        
        # 测试获取分类下的商品
        self.test_endpoint("获取分类商品", "GET", f"/api/categories/{category_id}/products")
        
        # 测试删除分类
        self.test_endpoint("删除分类", "DELETE", f"/api/categories/{category_id}")

    def test_upload_module(self):
        """测试上传模块"""
        print(f"\n{Fore.BLUE}{'='*50}")
        print(f"6. 上传模块测试 (/api/upload)")
        print(f"{'='*50}{Style.RESET_ALL}")
        
        # 注意：文件上传测试需要实际文件，这里只测试接口可达性
        self.log_warning("文件上传测试需要实际文件，跳过详细测试")
        
        # 测试获取文件信息（假设文件不存在）
        filename = "test_file.jpg"
        result = self.make_request("GET", f"/api/upload/{filename}")
        if result["status_code"] == 404:
            self.log_success("获取文件信息 - 正确返回404（文件不存在）")
        else:
            self.log_warning(f"获取文件信息 - 状态码: {result['status_code']}")

    def test_api_coverage(self):
        """检查API覆盖度"""
        print(f"\n{Fore.BLUE}{'='*50}")
        print(f"7. API覆盖度分析")
        print(f"{'='*50}{Style.RESET_ALL}")
        
        # 根据API文档定义的接口
        documented_apis = {
            "认证模块": [
                "POST /api/auth/login",
                "POST /api/auth/activate", 
                "POST /api/auth/forgot-password/request",
                "POST /api/auth/forgot-password/reset"
            ],
            "用户模块": [
                "GET /api/users/me",
                "POST /api/users/me/update",
                "GET /api/users/{userId}",
                "GET /api/users/{userId}/products",
                "GET /api/users/me/favorites"
            ],
            "商品模块": [
                "GET /api/products",
                "POST /api/products/create",
                "GET /api/products/{productId}",
                "POST /api/products/{productId}/update",
                "POST /api/products/{productId}/status",
                "POST /api/products/{productId}/delete",
                "POST /api/products/{productId}/favorite",
                "POST /api/products/{productId}/unfavorite"
            ],
            "评论模块": [
                "GET /api/products/{productId}/comments",
                "POST /api/products/{productId}/comments/create",
                "POST /api/comments/{commentId}/delete"
            ],
            "分类模块": [
                "GET /api/categories"
            ],
            "私信模块": [
                "GET /api/messages",
                "GET /api/messages/{userId}",
                "POST /api/messages/send",
                "POST /api/messages/{userId}/read"
            ],
            "通知模块": [
                "GET /api/notifications",
                "GET /api/notifications/unread-count",
                "POST /api/notifications/read"
            ],
            "举报模块": [
                "POST /api/reports/create"
            ],
            "公告模块": [
                "GET /api/notices",
                "GET /api/notices/{noticeId}"
            ],
            "管理模块": [
                "GET /api/admin/stats",
                "GET /api/admin/users",
                "POST /api/admin/users/{userId}/role/update",
                "POST /api/admin/users/{userId}/status/update",
                "GET /api/admin/products",
                "POST /api/admin/products/{productId}/remove",
                "POST /api/admin/categories/create",
                "POST /api/admin/categories/{categoryId}/update",
                "POST /api/admin/categories/{categoryId}/delete",
                "GET /api/admin/reports",
                "POST /api/admin/reports/{reportId}/process",
                "POST /api/admin/notices/create"
            ]
        }
        
        # 当前已实现的接口
        implemented_apis = {
            "认证模块": [
                "POST /api/auth/login",
                "POST /api/auth/activate",
                "POST /api/auth/forgot-password", 
                "POST /api/auth/reset-password"
            ],
            "用户模块": [
                "GET /api/users/profile",
                "PUT /api/users/profile",
                "GET /api/users/{id}",
                "GET /api/users/{id}/products",
                "GET /api/users/me/favorites"
            ],
            "商品模块": [
                "GET /api/products",
                "POST /api/products",
                "GET /api/products/{id}",
                "PUT /api/products/{id}",
                "DELETE /api/products/{id}",
                "POST /api/products/{id}/favorite",
                "DELETE /api/products/{id}/favorite",
                "POST /api/products/{id}/comments",
                "GET /api/products/{id}/comments",
                "DELETE /api/products/{id}/comments/{commentId}"
            ],
            "分类模块": [
                "GET /api/categories",
                "POST /api/categories",
                "GET /api/categories/{id}",
                "PUT /api/categories/{id}",
                "DELETE /api/categories/{id}",
                "GET /api/categories/{id}/products"
            ],
            "上传模块": [
                "POST /api/upload/single",
                "POST /api/upload/multiple",
                "DELETE /api/upload/{filename}",
                "GET /api/upload/{filename}"
            ],
            "私信模块": [
                "GET /api/messages",
                "GET /api/messages/{userId}",
                "POST /api/messages/send",
                "POST /api/messages/{userId}/read"
            ],
            "通知模块": [
                "GET /api/notifications",
                "GET /api/notifications/unread-count",
                "POST /api/notifications/read"
            ],
            "举报模块": [
                "POST /api/reports/create"
            ],
            "公告模块": [
                "GET /api/notices",
                "GET /api/notices/{noticeId}"
            ],
            "管理模块": [
                "GET /api/admin/stats",
                "GET /api/admin/users",
                "POST /api/admin/users/{userId}/role/update",
                "POST /api/admin/users/{userId}/status/update",
                "GET /api/admin/products",
                "POST /api/admin/products/{productId}/remove",
                "POST /api/admin/categories/create",
                "POST /api/admin/categories/{categoryId}/update", 
                "POST /api/admin/categories/{categoryId}/delete",
                "GET /api/admin/reports",
                "POST /api/admin/reports/{reportId}/process",
                "POST /api/admin/notices/create"
            ]
        }
        
        total_documented = sum(len(apis) for apis in documented_apis.values())
        total_implemented = sum(len(apis) for apis in implemented_apis.values())
        
        self.log_info(f"文档定义的API总数: {total_documented}")
        self.log_info(f"已实现的API总数: {total_implemented}")
        self.log_info(f"实现覆盖率: {(total_implemented/total_documented)*100:.1f}%")
        
        print(f"\n{Fore.YELLOW}未实现的模块:")
        missing_modules = set(documented_apis.keys()) - set(implemented_apis.keys())
        for module in missing_modules:
            print(f"  - {module}: {len(documented_apis[module])} 个接口")
            
        print(f"\n{Fore.YELLOW}需要补充的接口:")
        for module in ["私信模块", "通知模块", "举报模块", "公告模块", "管理模块"]:
            if module in documented_apis:
                print(f"  {module}:")
                for api in documented_apis[module]:
                    print(f"    - {api}")

    def test_messages_module(self):
        """测试私信模块"""
        print(f"\n{Fore.BLUE}{'='*50}")
        print(f"7. 私信模块测试 (/api/messages)")
        print(f"{'='*50}{Style.RESET_ALL}")
        
        # 测试获取会话列表
        self.test_endpoint("获取会话列表", "GET", "/api/messages")
        
        # 测试获取与指定用户的消息记录
        user_id = "2"
        self.test_endpoint("获取消息记录", "GET", f"/api/messages/{user_id}")
        
        # 测试发送私信
        message_data = {
            "receiverId": "2",
            "content": "你好，我对你的商品很感兴趣"
        }
        self.test_endpoint("发送私信", "POST", "/api/messages/send", message_data, 201)
        
        # 测试标记消息为已读
        self.test_endpoint("标记消息已读", "POST", f"/api/messages/{user_id}/read")

    def test_notifications_module(self):
        """测试通知模块"""
        print(f"\n{Fore.BLUE}{'='*50}")
        print(f"8. 通知模块测试 (/api/notifications)")
        print(f"{'='*50}{Style.RESET_ALL}")
        
        # 使用认证token
        headers = {"Authorization": f"Bearer {self.token}"} if self.token else {}
        
        # 测试获取通知列表
        self.test_endpoint("获取通知列表", "GET", "/api/notifications", headers=headers)
        
        # 测试获取未读通知数
        self.test_endpoint("获取未读通知数", "GET", "/api/notifications/unread-count", headers=headers)
        
        # 测试标记通知为已读
        read_data = {"notificationId": "notif_1"}
        self.test_endpoint("标记通知已读", "POST", "/api/notifications/read", read_data, headers=headers)
        
        # 测试标记所有通知为已读
        read_all_data = {"readAll": True}
        self.test_endpoint("标记所有通知已读", "POST", "/api/notifications/read", read_all_data, headers=headers)

    def test_reports_module(self):
        """测试举报模块"""
        print(f"\n{Fore.BLUE}{'='*50}")
        print(f"9. 举报模块测试 (/api/reports)")
        print(f"{'='*50}{Style.RESET_ALL}")
        
        # 测试创建举报
        report_data = {
            "type": "product",
            "targetId": "123",
            "reason": "虚假信息",
            "description": "该商品描述与实际不符"
        }
        self.test_endpoint("创建举报", "POST", "/api/reports/create", report_data, 201)
        
        # 测试获取举报记录
        self.test_endpoint("获取举报记录", "GET", "/api/reports/my-reports")

    def test_notices_module(self):
        """测试公告模块"""
        print(f"\n{Fore.BLUE}{'='*50}")
        print(f"10. 公告模块测试 (/api/notices)")
        print(f"{'='*50}{Style.RESET_ALL}")
        
        # 测试获取公告列表
        self.test_endpoint("获取公告列表", "GET", "/api/notices")
        
        # 测试获取公告详情
        notice_id = "1"
        self.test_endpoint("获取公告详情", "GET", f"/api/notices/{notice_id}")

    def test_users_favorites(self):
        """测试用户收藏功能"""
        print(f"\n{Fore.BLUE}{'='*50}")
        print(f"11. 用户收藏功能测试")
        print(f"{'='*50}{Style.RESET_ALL}")
        
        # 测试获取收藏商品
        self.test_endpoint("获取收藏商品", "GET", "/api/users/me/favorites")

    def test_admin_module(self):
        """测试管理员模块"""
        print(f"\n{Fore.BLUE}{'='*50}")
        print(f"12. 管理员模块测试 (/api/admin)")
        print(f"{'='*50}{Style.RESET_ALL}")
        
        # 使用管理员账号登录
        admin_login_data = {
            "studentId": "20210002",  # 李四是管理员
            "password": "password123"
        }
        admin_result = self.make_request("POST", "/api/auth/login", admin_login_data)
        admin_token = None
        if admin_result["success"] and "data" in admin_result["data"] and "token" in admin_result["data"]["data"]:
            admin_token = admin_result["data"]["data"]["token"]
            self.log_info(f"管理员登录成功，Token: {admin_token[:20]}...")
        
        admin_headers = {"Authorization": f"Bearer {admin_token}"} if admin_token else {}
        
        # 测试系统统计
        self.test_endpoint("获取系统统计", "GET", "/api/admin/stats", headers=admin_headers)
        
        # 测试用户管理
        self.test_endpoint("获取用户列表", "GET", "/api/admin/users", headers=admin_headers)
        
        # 测试商品管理
        self.test_endpoint("获取管理商品列表", "GET", "/api/admin/products", headers=admin_headers)
        
        # 测试举报管理
        self.test_endpoint("获取举报列表", "GET", "/api/admin/reports", headers=admin_headers)
        
        # 测试创建公告
        notice_data = {
            "title": "测试公告",
            "content": "这是一个测试公告内容",
            "type": "测试公告",
            "isActive": True
        }
        self.test_endpoint("创建公告", "POST", "/api/admin/notices/create", notice_data, 201, headers=admin_headers)
        
        # 测试管理员分类管理
        admin_category_data = {
            "name": "管理员测试分类",
            "description": "这是管理员创建的测试分类"
        }
        self.test_endpoint("管理员创建分类", "POST", "/api/admin/categories/create", admin_category_data, 201, headers=admin_headers)
        
        # 获取分类ID用于后续测试
        categories_result = self.make_request("GET", "/api/categories")
        category_id = None
        if categories_result["success"] and "data" in categories_result["data"]:
            categories = categories_result["data"]["data"]
            if categories and len(categories) > 0:
                category_id = categories[0]["id"]
        
        if category_id:
            # 测试管理员更新分类
            update_category_data = {
                "name": "更新后的分类名称",
                "description": "更新后的分类描述"
            }
            self.test_endpoint("管理员更新分类", "POST", f"/api/admin/categories/{category_id}/update", update_category_data, headers=admin_headers)

    def run_all_tests(self):
        """运行所有测试"""
        print(f"{Fore.MAGENTA}{'='*60}")
        print(f"校园二手交易平台 API 全面测试")
        print(f"{'='*60}{Style.RESET_ALL}")
        
        start_time = time.time()
        
        # 运行各模块测试
        self.test_health_check()
        self.test_auth_module()
        self.test_users_module()
        self.test_products_module()
        self.test_categories_module()
        self.test_upload_module()
        self.test_messages_module()
        self.test_notifications_module()
        self.test_reports_module()
        self.test_notices_module()
        self.test_users_favorites()
        self.test_admin_module()
        self.test_api_coverage()
        
        # 测试结果统计
        end_time = time.time()
        duration = end_time - start_time
        
        print(f"\n{Fore.MAGENTA}{'='*60}")
        print(f"测试结果汇总")
        print(f"{'='*60}{Style.RESET_ALL}")
        
        passed = len([r for r in self.test_results if r["status"] == "PASSED"])
        failed = len([r for r in self.test_results if r["status"] == "FAILED"])
        total = len(self.test_results)
        
        print(f"总测试数: {total}")
        print(f"{Fore.GREEN}通过: {passed}{Style.RESET_ALL}")
        print(f"{Fore.RED}失败: {failed}{Style.RESET_ALL}")
        print(f"成功率: {(passed/total)*100:.1f}%" if total > 0 else "成功率: 0%")
        print(f"测试耗时: {duration:.2f}秒")
        
        if failed > 0:
            print(f"\n{Fore.RED}失败的测试:")
            for result in self.test_results:
                if result["status"] == "FAILED":
                    error = result.get("error", "未知错误")
                    print(f"  - {result['name']}: {error}")

def main():
    """主函数"""
    print("开始API测试...")
    
    tester = APITester()
    tester.run_all_tests()
    
    print(f"\n{Fore.CYAN}测试完成！")
    print(f"如需查看详细的API文档，请参考 api接口文档.md{Style.RESET_ALL}")

if __name__ == "__main__":
    main() 