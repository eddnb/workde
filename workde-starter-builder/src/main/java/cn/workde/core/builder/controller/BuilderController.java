package cn.workde.core.builder.controller;

import cn.workde.core.base.utils.WebUtils;
import cn.workde.core.builder.engine.service.BuilderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;

/**
 * @author zhujingang
 * @date 2019/9/17 9:49 PM
 */
@Controller
@RequestMapping(value = "builder")
public class BuilderController {

	@Autowired
	private BuilderService builderService;

	@RequestMapping(method = {RequestMethod.GET, RequestMethod.POST})
	@ResponseBody
	public void index() {
		try {
			String xwl = WebUtils.getRequest().getParameter("xwl");
			builderService.parse(xwl);
		} catch (Exception e) {
			e.printStackTrace();
		}
	}
}
