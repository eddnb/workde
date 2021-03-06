package cn.workde.core.sample.boot.controller.admin;


import cn.workde.core.admin.module.menu.annotation.AdminMenu;
import cn.workde.core.admin.web.annotation.AdminController;
import cn.workde.core.admin.controller.ModuleController;
import cn.workde.core.sample.boot.modules.defined.UserDefine;
import cn.workde.core.sample.boot.modules.menu.ArticleModuleListener;
import io.swagger.annotations.Api;

/**
 * @author zhujingang
 * @date 2019/9/2 5:15 PM
 */
@AdminController(define = UserDefine.class, path = "sys/users", adminMenus = {
	@AdminMenu(groupId = ArticleModuleListener.MENU_GROUP_COMPANY, text = "用户管理", methodName = "list", icon = "layui-icon-group")
})
@Api(tags = "用户管理")
public class SysUserController extends ModuleController {

}
