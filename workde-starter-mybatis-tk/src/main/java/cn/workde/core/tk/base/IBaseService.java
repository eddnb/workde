package cn.workde.core.tk.base;

import com.github.pagehelper.PageInfo;
import tk.mybatis.mapper.entity.Example;

import java.util.List;
import java.util.Map;

/**
 * @author zhujingang
 * @date 2019/10/8 10:39 AM
 */
public interface IBaseService<T extends BaseEntity> {

	boolean unique(String property, String value);

	T one(T entity);

	T one(Map<String, Object> params);

	T byId(String id);

	T save(T entity);

	int count(T entity);

	int count(Map<String, Object> params);

	int count(Example example);

	List<T> list(Map<String, Object> params);

	List<T> list(String orderBy);

	List<T> list(Map<String, Object> params, String orderBy);

	List<T> list(Example example);

	PageInfo<T> page(int pageNum, int pageSize);

	PageInfo<T> page(Map<String, Object> params, int pageNum, int pageSize);

	PageInfo<T> page(String orderBy, int pageNum, int pageSize);

	PageInfo<T> page(Example example, int pageNum, int pageSize);

	void delete(T entity);

	void deleteById(String id);

	void deleteByExample(T entity);

	void update(T entity, Map<String, Object> params);

	void updateById(T entity);

	void updateByExample(T entity, Example example);

	void updateByIdSelective(T entity);

	void updateByExampleSelective(T entity, Example example);
}
