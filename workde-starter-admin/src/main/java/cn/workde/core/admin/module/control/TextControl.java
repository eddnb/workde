package cn.workde.core.admin.module.control;

import cn.workde.core.base.module.constant.Inputs;
import lombok.Data;

/**
 * @author zhujingang
 * @date 2019/9/30 1:54 PM
 */
@Data
public class TextControl extends FormControl {
	@Override
	public String getType() {
		return Inputs.DEFAULT;
	}
}
