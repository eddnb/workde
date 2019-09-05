package cn.workde.core.cpanel.config;

import cn.workde.core.cpanel.controller.IndexController;
import cn.workde.core.cpanel.controller.LoginController;
import cn.workde.core.base.menu.MenuList;
import cn.workde.core.base.menu.MenuManager;
import cn.workde.core.cpanel.module.ModuleListener;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.AutoConfigureAfter;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.web.reactive.function.client.WebClientAutoConfiguration;
import org.springframework.boot.web.context.WebServerInitializedEvent;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.event.EventListener;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.ServiceLoader;
import java.util.stream.Collectors;

/**
 * @author zhujingang
 * @date 2019/9/5 5:10 PM
 */
@Configuration
@AutoConfigureAfter({WebClientAutoConfiguration.class})
@Slf4j
public class WorkdeCpanelAutoConfiguration {

	@Bean
	@ConditionalOnMissingBean
	public LoginController loginController() {
		return new LoginController();
	}

	@Bean
	@ConditionalOnMissingBean
	public IndexController indexController() {
		return new IndexController();
	}

	@EventListener(WebServerInitializedEvent.class)
	public void initAdminMenuItems() {
		List<ModuleListener> moduleListenerList = new ArrayList<>();
		ServiceLoader.load(ModuleListener.class).forEach(moduleListenerList::add);
		moduleListenerList.stream().sorted(Comparator.comparing(ModuleListener::getOrder)).collect(Collectors.toList())
			.forEach(moduleListener -> {
				moduleListener.onConfigSystemMenu(MenuManager.getInstance().getSystemMenus());
				moduleListener.onConfigAdminMenu(MenuManager.getInstance().getModuleMenus());
			});
		log.info("【初始化配置-菜单管理】... 已初始化完毕");
	}

}
