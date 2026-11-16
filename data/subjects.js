/* ===== 学科注册表 =====
 * 这里只登记「有哪些学科、哪些年级」，题库本体在 data/banks/<学科>/<年级>.js。
 * grades 为空数组表示该学科没有年级概念（如计算机），直接按阶段/教材划分。
 * 新增学科：在这里加一条，再去 data/banks/<学科>/ 放题库文件即可。
 */
window.SUBJECTS = {
  gradeNames: ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级'],
  list: [
    { key: 'chinese', name: '语文', flag: '语', grades: [1, 2, 3, 4, 5, 6], volumes: ['上册', '下册'] },
    { key: 'math', name: '数学', flag: '数', grades: [1, 2, 3, 4, 5, 6], volumes: ['上册', '下册'] },
    { key: 'english', name: '英语', flag: '英', grades: [3, 4, 5, 6], volumes: ['上册', '下册'] }
  ]
};
