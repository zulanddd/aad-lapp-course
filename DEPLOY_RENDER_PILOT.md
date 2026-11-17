# AaD 免费课程试用部署

此分支以往届 Group 11 项目为基础。确认课程允许沿用的代码进行公网部署后，将源码放到本组私有 GitHub 仓库；不使用往届仓库作为部署目标，不导入任何本机账户、报告或照片。

## Render

1. 登录 [Render Dashboard](https://dashboard.render.com/)，连接小组私有仓库。使用仓库根目录的 `render.yaml` 创建 Blueprint。确认后端和 PostgreSQL 都是 **Free**，前端是 Static Site；无需购买域名或挂磁盘。
2. 在部署表单里填入 `ADMIN_EMAIL` 和新的 `ADMIN_PASSWORD`（至少 12 位，最多 72 字符；建议使用密码管理器生成 ASCII 随机密码）。`CORS_ALLOWED_ORIGINS` 填真实的前端 HTTPS origin，`REACT_APP_API_URL` 填真实的后端 HTTPS origin，两者不带尾部斜杠和路径。若初次只知道预计地址，可先用 `https://aad-lapp-course.onrender.com` 和 `https://aad-lapp-course-api.onrender.com`。创建后以 Dashboard 实际地址为准，若不同，在相应服务的 Environment 中更正并重新部署。不要复用本机管理员密码。
3. Render 自动注入内部 PostgreSQL 连接和独立 JWT 密钥。数据库只接受私网连接。后端健康检查使用实际存在的 `/api/drains`，不依赖 Actuator。
4. 在静态站点 Environment 添加 `REACT_APP_GOOGLE_MAPS_API_KEY`，然后重新构建并部署。使用团队为这个试用地址准备的浏览器 key；标准 key 的网站来源限制设为实际的线上前端域名，API 限制为 Maps JavaScript API。课程原型可使用合规的 Demo Key，不将其用于生产。可选变量 `REACT_APP_GOOGLE_MAPS_MAP_ID`，不填写时沿用本地演示地图 ID。地图未配置时，地点列表和文字报告可用。
5. 从另一台设备打开前端 HTTPS 链接，检查首页、底图、直接打开子路由、普通用户注册登录、管理员登录及发布测试点位、私密报告链接，以及后端重启后的照片。记录 Render 数据库页面显示的到期日，再把前端网址分享给助教和组员。

线上试用版会提示只使用测试数据。报告可以附一张 JPG／PNG 测试照片，上传最多 5 MB；照片清除元数据后以最多 512 KiB 的 JPEG 存入独立的私密数据库表。报告照片总配额为 128 MiB，达到上限后仍可提交文字报告。只有报告私密链接持有人和管理员可以查看，公开点位照片独立存储。请勿录入真实居民资料。免费数据库 30 天后到期；如需保存测试成果，在到期前为自己的 IP 临时开放数据库外部访问，使用 `pg_dump` 导出测试库，然后关闭外部访问。免费后端休眠后首次打开可能约需一分钟。

- [Render Blueprint 官方说明](https://render.com/docs/blueprint-spec)
- [Render 免费服务限制](https://render.com/docs/free)
- [Google Maps API key 指南](https://developers.google.com/maps/documentation/javascript/get-api-key)
