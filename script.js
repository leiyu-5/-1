// 数据存储
let tasks = []; // 任务列表
let persons = []; // 人员列表
let scheduledTasks = []; // 已排任务列表

// 从localStorage加载数据
function loadData() {
    // 从本地存储中获取保存的任务和人员数据
    const savedTasks = localStorage.getItem('tasks');
    const savedPersons = localStorage.getItem('persons');
    
    // 如果有保存的任务数据，解析并赋值给tasks数组
    if (savedTasks) {
        tasks = JSON.parse(savedTasks);
    }
    
    // 如果有保存的人员数据，解析并赋值给persons数组
    if (savedPersons) {
        persons = JSON.parse(savedPersons);
    }
}

// 保存数据到localStorage
function saveData() {
    // 将任务数据转换为JSON字符串并保存到本地存储
    localStorage.setItem('tasks', JSON.stringify(tasks));
    // 将人员数据转换为JSON字符串并保存到本地存储
    localStorage.setItem('persons', JSON.stringify(persons));
    // 更新看板数据显示
    updateDashboard();
}

// 更新看板数据
function updateDashboard() {
    // 计算总任务数
    const totalTasks = tasks.length;
    // 计算已排任务数
    const scheduledTasks = tasks.filter(task => task.status === 'scheduled').length;
    // 计算未排任务数
    const unscheduledTasks = tasks.filter(task => task.status === 'pending').length;
    // 计算空余人员数（非请假且工作时长不足8小时的人员）
    const availablePersons = persons.filter(person => !person.isOnLeave && person.workedHours < 8).length;
    
    // 更新看板显示
    document.getElementById('total-tasks').textContent = totalTasks;
    document.getElementById('scheduled-tasks').textContent = scheduledTasks;
    document.getElementById('unscheduled-tasks').textContent = unscheduledTasks;
    document.getElementById('available-persons').textContent = availablePersons;
}

// 获取当前北京时间
function getBeijingTime() {
    // 获取当前时间
    const now = new Date();
    // 计算UTC时间
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    // 计算北京时间（UTC+8）
    const beijingTime = new Date(utc + (8 * 60 * 60000));
    return beijingTime;
}

// 格式化日期为YYYY-MM-DD
function formatDate(date) {
    // 获取年份
    const year = date.getFullYear();
    // 获取月份（加1，因为月份从0开始）
    const month = String(date.getMonth() + 1).padStart(2, '0');
    // 获取日期
    const day = String(date.getDate()).padStart(2, '0');
    // 组合为YYYY-MM-DD格式
    return `${year}-${month}-${day}`;
}

// 初始化页面
function init() {
    // 加载数据
    loadData();
    
    // 设置日期输入框的默认值为北京时间
    const beijingDate = formatDate(getBeijingTime());
    document.getElementById('task-node').value = beijingDate;
    document.getElementById('schedule-date').value = beijingDate;
    
    // 标签页切换事件
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.getAttribute('data-tab');
            
            // 移除所有标签页的活动状态
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            // 添加当前标签页的活动状态
            this.classList.add('active');
            document.getElementById(tab).classList.add('active');
            
            // 如果切换到人员管理页面，更新人员选择下拉框
            if (tab === 'personnel') {
                updatePersonSelect();
            }
            
            // 如果切换到结果页面，更新结果显示
            if (tab === 'result') {
                updateResultDisplay();
            }
        });
    });
    
    // 添加任务表单提交事件
    document.getElementById('add-task-form').addEventListener('submit', function(e) {
        e.preventDefault();
        addTask();
        // 提交后重新设置日期为北京时间
        document.getElementById('task-node').value = formatDate(getBeijingTime());
    });
    
    // 添加人员表单提交事件
    document.getElementById('add-person-form').addEventListener('submit', function(e) {
        e.preventDefault();
        addPerson();
    });
    
    // 添加技能表单提交事件
    document.getElementById('add-skill-form').addEventListener('submit', function(e) {
        e.preventDefault();
        addSkill();
    });
    
    // 排任务表单提交事件
    document.getElementById('schedule-form').addEventListener('submit', function(e) {
        e.preventDefault();
        scheduleTasks();
    });
    
    // 重置排任务结果按钮点击事件
    document.getElementById('reset-schedule-btn').addEventListener('click', resetSchedule);
    
    // 初始化显示
    updateTaskTable();
    updatePersonTable();
    updateDashboard();
}

// 添加任务
function addTask() {
    // 获取表单输入值
    const name = document.getElementById('task-name').value;
    const node = document.getElementById('task-node').value;
    const skills = document.getElementById('task-skills').value.split(',').map(s => s.trim());
    const hours = parseInt(document.getElementById('task-hours').value);
    
    // 创建任务对象
    const task = {
        id: Date.now(), // 使用时间戳作为唯一ID
        name, // 任务名称
        node, // 任务节点（日期）
        skills, // 所需技能数组
        hours, // 所需人力（小时）
        status: 'pending', // 初始状态为待排
        assignedPerson: null // 初始未分配人员
    };
    
    // 添加任务到任务列表
    tasks.push(task);
    // 更新任务表格显示
    updateTaskTable();
    // 保存数据到本地存储
    saveData();
    
    // 重置表单
    document.getElementById('add-task-form').reset();
}

// 更新任务表格
function updateTaskTable() {
    // 获取任务表格的tbody元素
    const tbody = document.querySelector('#task-table tbody');
    // 清空表格内容
    tbody.innerHTML = '';
    
    // 遍历任务列表，为每个任务创建表格行
    tasks.forEach(task => {
        const row = document.createElement('tr');
        // 设置表格行的内容
        row.innerHTML = `
            <td>${task.name}</td>
            <td>${task.node}</td>
            <td>${task.skills.join(', ')}</td>
            <td>${task.hours}小时</td>
            <td class="status-${task.status}">${task.status === 'pending' ? '待排' : '已排'}</td>
            <td>
                <button class="action-btn delete" onclick="deleteTask(${task.id})">删除</button>
            </td>
        `;
        // 将表格行添加到tbody中
        tbody.appendChild(row);
    });
}

// 删除任务
function deleteTask(id) {
    // 过滤掉ID为传入值的任务
    tasks = tasks.filter(task => task.id !== id);
    // 更新任务表格显示
    updateTaskTable();
    // 保存数据到本地存储
    saveData();
}

// 添加人员
function addPerson() {
    // 获取表单输入值
    const name = document.getElementById('person-name').value;
    
    // 创建人员对象
    const person = {
        id: Date.now(), // 使用时间戳作为唯一ID
        name, // 人员姓名
        skills: [], // 初始技能为空数组
        workedHours: 0, // 初始工作时长为0
        isOnLeave: false // 初始状态为正常（非请假）
    };
    
    // 添加人员到人员列表
    persons.push(person);
    // 更新人员表格显示
    updatePersonTable();
    // 更新技能表单的人员选择下拉框
    updatePersonSelect();
    // 保存数据到本地存储
    saveData();
    
    // 重置表单
    document.getElementById('add-person-form').reset();
}

// 更新人员选择下拉框
function updatePersonSelect() {
    // 获取技能表单中的人员选择下拉框
    const select = document.getElementById('skill-person');
    // 清空下拉框内容
    select.innerHTML = '';
    
    // 遍历人员列表，为每个人员创建下拉框选项
    persons.forEach(person => {
        const option = document.createElement('option');
        option.value = person.id; // 设置选项值为人员ID
        option.textContent = person.name; // 设置选项文本为人员姓名
        select.appendChild(option); // 添加选项到下拉框
    });
}

// 添加技能
function addSkill() {
    // 获取表单输入值
    const personId = parseInt(document.getElementById('skill-person').value);
    const skillName = document.getElementById('skill-name').value;
    
    // 查找对应的人员
    const person = persons.find(p => p.id === personId);
    // 如果人员存在且技能不存在，则添加技能
    if (person && !person.skills.includes(skillName)) {
        person.skills.push(skillName); // 添加技能到人员的技能列表
        updatePersonTable(); // 更新人员表格显示
        saveData(); // 保存数据到本地存储
        
        // 重置表单
        document.getElementById('add-skill-form').reset();
    }
}

// 更新人员表格
function updatePersonTable() {
    // 获取人员表格的tbody元素
    const tbody = document.querySelector('#person-table tbody');
    // 清空表格内容
    tbody.innerHTML = '';
    
    // 遍历人员列表，为每个人员创建表格行
    persons.forEach(person => {
        const row = document.createElement('tr');
        // 设置表格行的内容
        row.innerHTML = `
            <td>${person.name}</td>
            <td>${person.skills.join(', ') || '无'}</td>
            <td>${person.workedHours}小时</td>
            <td class="status-${person.isOnLeave ? 'leave' : 'pending'}">${person.isOnLeave ? '请假' : '正常'}</td>
            <td>
                <button class="action-btn leave" onclick="toggleLeave(${person.id})">${person.isOnLeave ? '取消请假' : '请假'}</button>
                <button class="action-btn delete" onclick="deletePerson(${person.id})">删除</button>
            </td>
        `;
        // 将表格行添加到tbody中
        tbody.appendChild(row);
    });
}

// 切换请假状态
function toggleLeave(id) {
    // 查找对应的人员
    const person = persons.find(p => p.id === id);
    // 如果人员存在，切换其请假状态
    if (person) {
        person.isOnLeave = !person.isOnLeave; // 切换请假状态
        updatePersonTable(); // 更新人员表格显示
        saveData(); // 保存数据到本地存储
    }
}

// 删除人员
function deletePerson(id) {
    // 过滤掉ID为传入值的人员
    persons = persons.filter(person => person.id !== id);
    // 更新人员表格显示
    updatePersonTable();
    // 更新技能表单的人员选择下拉框
    updatePersonSelect();
    // 保存数据到本地存储
    saveData();
}

// 重置排任务结果
function resetSchedule() {
    // 重置人员工作时长
    persons.forEach(person => {
        person.workedHours = 0; // 重置为0小时
    });
    
    // 重置任务状态
    tasks.forEach(task => {
        task.status = 'pending'; // 重置为待排状态
        task.assignedPerson = null; // 重置为未分配人员
    });
    
    // 清空已排任务列表
    scheduledTasks = [];
    
    // 更新显示
    updateTaskTable();
    updatePersonTable();
    updateDashboard();
    
    // 清空排任务结果显示
    document.getElementById('schedule-result').innerHTML = '';
    
    // 提示用户
    alert('排任务结果已重置');
}

// 排任务
function scheduleTasks() {
    // 获取排任务日期
    const date = document.getElementById('schedule-date').value;
    
    // 重置人员工作时长
    persons.forEach(person => {
        person.workedHours = 0; // 重置为0小时
    });
    
    // 重置任务状态
    tasks.forEach(task => {
        task.status = 'pending'; // 重置为待排状态
        task.assignedPerson = null; // 重置为未分配人员
    });
    
    // 清空已排任务列表
    scheduledTasks = [];
    
    // 按任务节点排序（时间优先级）
    const sortedTasks = [...tasks].sort((a, b) => new Date(a.node) - new Date(b.node));
    
    // 过滤出非请假人员
    const availablePersons = persons.filter(person => !person.isOnLeave);
    
    // 排任务逻辑
    sortedTasks.forEach(task => {
        // 查找适合的人员（有对应技能且工作时长未达8小时）
        const suitablePersons = availablePersons.filter(person => {
            // 检查是否具备所有所需技能
            const hasSkills = task.skills.every(skill => person.skills.includes(skill));
            // 检查工作时长是否足够
            const hasTime = person.workedHours + task.hours <= 8;
            return hasSkills && hasTime;
        });
        
        if (suitablePersons.length > 0) {
            // 技能匹配度计算函数：计算人员技能与任务技能的匹配度
            function calculateSkillMatch(person, task) {
                // 计算人员技能与任务技能的交集
                const matchedSkills = person.skills.filter(skill => task.skills.includes(skill));
                // 计算匹配度：匹配技能数 / 人员总技能数
                // 这样，技能越少的人员匹配度越高
                return matchedSkills.length / person.skills.length;
            }
            
            // 排序逻辑：
            // 1. 首先按技能匹配度降序排序（技能匹配度越高越优先）
            // 2. 然后按工作时长升序排序（工作时长越少越优先）
            const selectedPerson = suitablePersons.sort((a, b) => {
                // 计算技能匹配度
                const matchA = calculateSkillMatch(a, task);
                const matchB = calculateSkillMatch(b, task);
                
                // 首先比较技能匹配度
                if (matchA !== matchB) {
                    return matchB - matchA; // 匹配度高的优先
                }
                // 如果技能匹配度相同，比较工作时长
                return a.workedHours - b.workedHours; // 工作时长少的优先
            })[0];
            
            // 分配任务
            task.status = 'scheduled'; // 标记为已排状态
            task.assignedPerson = selectedPerson.id; // 分配人员ID
            selectedPerson.workedHours += task.hours; // 更新工作时长
            
            // 添加到已排任务列表
            scheduledTasks.push({
                ...task, // 复制任务信息
                assignedPersonName: selectedPerson.name // 添加人员姓名
            });
        }
    });
    
    // 更新任务表格
    updateTaskTable();
    updatePersonTable();
    updateDashboard();
    
    // 显示排任务结果
    const resultDiv = document.getElementById('schedule-result');
    resultDiv.innerHTML = `
        <h3>排任务结果</h3>
        <p>排任务日期：${date}</p>
        <p>已排任务：${scheduledTasks.length}个</p>
        <p>未排任务：${tasks.filter(t => t.status === 'pending').length}个</p>
        <p>空余人员：${availablePersons.filter(p => p.workedHours < 8).length}人</p>
        <button class="btn" onclick="document.querySelector('[data-tab=result]').click()">查看详细结果</button>
    `;
}

// 更新结果显示
function updateResultDisplay() {
    // 更新已排任务表格
    const scheduledTbody = document.querySelector('#scheduled-tasks-table tbody'); // 获取已排任务表格的tbody元素
    scheduledTbody.innerHTML = ''; // 清空表格内容
    
    // 遍历已排任务列表，为每个任务创建表格行
    scheduledTasks.forEach(task => {
        const row = document.createElement('tr'); // 创建表格行元素
        // 设置表格行的内容
        row.innerHTML = `
            <td>${task.name}</td>
            <td>${task.node}</td>
            <td>${task.skills.join(', ')}</td>
            <td>${task.hours}小时</td>
            <td>${task.assignedPersonName}</td>
        `;
        scheduledTbody.appendChild(row); // 将表格行添加到tbody中
    });
    
    // 更新未排任务表格
    const unscheduledTbody = document.querySelector('#unscheduled-tasks-table tbody'); // 获取未排任务表格的tbody元素
    unscheduledTbody.innerHTML = ''; // 清空表格内容
    
    // 过滤出未排任务
    const unscheduledTasks = tasks.filter(task => task.status === 'pending');
    // 遍历未排任务列表，为每个任务创建表格行
    unscheduledTasks.forEach(task => {
        const row = document.createElement('tr'); // 创建表格行元素
        // 设置表格行的内容
        row.innerHTML = `
            <td>${task.name}</td>
            <td>${task.node}</td>
            <td>${task.skills.join(', ')}</td>
            <td>${task.hours}小时</td>
        `;
        unscheduledTbody.appendChild(row); // 将表格行添加到tbody中
    });
    
    // 更新空余人员表格
    const availableTbody = document.querySelector('#available-persons-table tbody'); // 获取空余人员表格的tbody元素
    availableTbody.innerHTML = ''; // 清空表格内容
    
    // 过滤出非请假且工作时长不足8小时的人员
    const availablePersons = persons.filter(person => !person.isOnLeave && person.workedHours < 8);
    // 遍历空余人员列表，为每个人员创建表格行
    availablePersons.forEach(person => {
        const row = document.createElement('tr'); // 创建表格行元素
        // 设置表格行的内容
        row.innerHTML = `
            <td>${person.name}</td>
            <td>${person.skills.join(', ') || '无'}</td>
            <td>${person.workedHours}小时</td>
            <td>${8 - person.workedHours}小时</td>
        `;
        availableTbody.appendChild(row); // 将表格行添加到tbody中
    });
}

// 复制结果文本
function copyResultText() {
    // 过滤出已排任务
    const scheduledTasks = tasks.filter(task => task.status === 'scheduled');
    // 如果没有已排任务，显示提示信息
    if (scheduledTasks.length === 0) {
        alert('没有已排任务可复制');
        return;
    }
    
    // 构建结果文本
    let text = '【任务分配通知】\n\n'; // 初始化文本内容
    // 遍历已排任务，构建通知文本
    scheduledTasks.forEach(task => {
        text += `任务：${task.name}\n`; // 添加任务名称
        text += `时间：${task.node}\n`; // 添加任务时间
        text += `负责人：${task.assignedPersonName}\n`; // 添加负责人
        text += `工时：${task.hours}小时\n\n`; // 添加工时
    });
    
    // 复制到剪贴板
    navigator.clipboard.writeText(text).then(() => {
        alert('已复制到剪贴板'); // 复制成功提示
    });
}

// 导出Excel
function exportExcel() {
    // 过滤出已排任务
    const scheduledTasks = tasks.filter(task => task.status === 'scheduled');
    // 如果没有已排任务，显示提示信息
    if (scheduledTasks.length === 0) {
        alert('没有已排任务可导出');
        return;
    }
    
    // 准备Excel数据
    const headers = ['任务名称', '任务节点', '所需技能', '所需人力', '分配人员'];
    const data = scheduledTasks.map(task => {
        // 查找分配人员的姓名
        let assignedPersonName = '';
        if (task.assignedPerson) {
            const person = persons.find(p => p.id === task.assignedPerson);
            assignedPersonName = person ? person.name : '';
        }
        return [
            task.name, // 任务名称
            task.node, // 任务节点
            task.skills.join(','), // 所需技能
            `${task.hours}小时`, // 所需人力
            assignedPersonName // 分配人员
        ];
    });
    
    // 合并表头和数据
    const csvContent = [
        headers.join(','), // 表头
        ...data.map(row => row.join(',')) // 数据行
    ].join('\n'); // 用换行符连接
    
    // 创建Blob对象
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `任务分配_${formatDate(new Date())}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert('Excel导出成功');
}

// 发送通知
function sendNotification() {
    // 过滤出已排任务
    const scheduledTasks = tasks.filter(task => task.status === 'scheduled');
    // 如果没有已排任务，显示提示信息
    if (scheduledTasks.length === 0) {
        alert('没有已排任务可发送通知');
        return;
    }
    
    // 模拟发送通知
    alert('通知已发送（模拟）'); // 显示通知发送成功提示
}

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', function() {
    // 初始化页面
    init();
    
    // 添加操作按钮事件监听器
    document.getElementById('copy-result-btn').addEventListener('click', copyResultText);
    document.getElementById('export-excel-btn').addEventListener('click', exportExcel);
    document.getElementById('send-notification-btn').addEventListener('click', sendNotification);
});