package cn.workde.core.secure.interceptor;

import cn.workde.core.base.result.Result;
import cn.workde.core.base.utils.JsonUtils;
import cn.workde.core.base.utils.WebUtils;
import cn.workde.core.secure.properties.WorkdeSecureProperties;
import cn.workde.core.token.TokenUtil;
import com.alibaba.fastjson.JSON;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.servlet.handler.HandlerInterceptorAdapter;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Objects;

/**
 * jwt拦截器校验
 * @author zhujingang
 * @date 2019/8/29 5:13 PM
 */
@Slf4j
@AllArgsConstructor
public class TokenInterceptor extends HandlerInterceptorAdapter {

	private WorkdeSecureProperties workdeSecureProperties;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (null != TokenUtil.getUserInfo()) {
            return true;
        } else {
            log.warn("签名认证失败，请求接口：{}，请求IP：{}，请求参数：{}", request.getRequestURI(), WebUtils.getIP(request), JSON.toJSONString(request.getParameterMap()));
            Result result = Result.unauthorized();
            response.setCharacterEncoding("UTF-8");
            response.setHeader("Content-type", MediaType.APPLICATION_JSON_UTF8_VALUE);
            response.setStatus(HttpServletResponse.SC_OK);
            try {
				response.getWriter().write(Objects.requireNonNull(JsonUtils.toJson(result)));
//				if(WebUtils.isAjax()) {
//					response.getWriter().write(Objects.requireNonNull(JsonUtils.toJson(result)));
//				} else {
//					response.sendRedirect(workdeSecureProperties.getLoginPage());
//				}
            } catch (IOException e) {
                e.printStackTrace();
            }
            return false;
        }
    }
}
