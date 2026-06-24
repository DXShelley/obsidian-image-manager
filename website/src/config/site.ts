export interface FeatureItem {
  readonly title: string;
  readonly description: string;
  readonly meta: string;
}

export interface StatusItem {
  readonly title: string;
  readonly description: string;
  readonly status: 'implemented' | 'planned';
}

export const siteConfig = {
  name: 'Obsidian Image Manager',
  version: 'v3.0.0',
  hero: {
    badge: 'Major Release / Image Ops for Obsidian',
    title: '把零散图片操作，变成可恢复、可批量、可发布的笔记工作流。',
    subtitle:
      '面向 Obsidian 的图片管理插件，围绕受管目录、批处理、阅读画廊和右键编辑重构图片流程。现在已经覆盖从粘贴导入到恢复回滚的整条链路。',
    primaryCta: { label: '查看功能状态', href: '#status' },
    secondaryCta: { label: '浏览核心能力', href: '#features' }
  },
  stats: [
    { value: 'v3.0.0', label: '最新大版本发布' },
    { value: 'Note / Folder / Vault', label: '批量作用域' },
    { value: 'Undo / Redo', label: '图片修改可恢复' }
  ],
  pillars: [
    {
      title: '受管目录与命名规则',
      description: '支持 `./assets/${noteFileName}` 这类按笔记组织的目录模板，并用变量生成稳定文件名。',
      meta: 'Paste / Rename / Relocate'
    },
    {
      title: '批量处理而不是单点命令',
      description: '压缩、转换、链接重写和清理都能作用于当前笔记、当前文件夹或整个仓库。',
      meta: 'Scoped Batch Jobs'
    },
    {
      title: '右键编辑直接落到图片文件',
      description: '复制、压缩、转换、旋转、翻转、拖拽裁剪和框选去水印，都能从文件右键菜单直达。',
      meta: 'Context Menu Editing'
    },
    {
      title: '恢复事务是主能力不是补丁',
      description: '图片和 Markdown 的修改都会进入持久化恢复事务，支持撤销与重做最近的操作。',
      meta: 'Recovery First'
    }
  ] as readonly FeatureItem[],
  workflow: [
    {
      step: '01',
      title: '导入图片',
      description: '粘贴图片或图片 URL，插件自动接管保存目录、格式与命名。'
    },
    {
      step: '02',
      title: '整理链接',
      description: '统一 Markdown / Wiki 链接风格，并处理中文、空格、括号和编码路径。'
    },
    {
      step: '03',
      title: '批量处理',
      description: '在笔记、文件夹或整库范围执行压缩、转换、迁移与孤立图片清理。'
    },
    {
      step: '04',
      title: '回滚风险',
      description: '任何图片修改都可通过恢复事务撤销或重做，避免“一次操作全改坏”。'
    }
  ],
  status: [
    {
      title: '增强画廊',
      description: '支持当前图片、当前笔记和当前文件夹画廊，并在阅读视图中双击图片直接打开。',
      status: 'implemented'
    },
    {
      title: '可恢复图片编辑',
      description: '旋转、翻转、压缩、转换、裁剪和去水印都纳入恢复事务。',
      status: 'implemented'
    },
    {
      title: '受管目录同步',
      description: '笔记重命名或移动后，可同步迁移受管图片目录并按规则重命名图片。',
      status: 'implemented'
    },
    {
      title: '孤立图片智能处置',
      description: '遇到唯一外部引用时自动迁移到对应笔记目录，而不是粗暴删除。',
      status: 'implemented'
    },
    {
      title: '编辑器内拖拽调整尺寸',
      description: '后续会补上直接在编辑器中拖拽调整图片显示尺寸的交互。',
      status: 'planned'
    },
    {
      title: '交互式画布编辑 UI',
      description: '当前已有轻量编辑和右键处理链路，完整画布式编辑器仍在规划和补强中。',
      status: 'planned'
    },
    {
      title: 'OCR / 搜索 / 分类',
      description: '后续会把图片识别和检索能力引入图片工作流，而不止停留在存储与处理。',
      status: 'planned'
    },
    {
      title: 'Worker 后台处理',
      description: '计划把更重的批量任务转到后台执行，减少对前台交互的阻塞。',
      status: 'planned'
    }
  ] as readonly StatusItem[],
  detailCards: [
    {
      eyebrow: 'Gallery',
      title: '图片浏览不再只靠文件树。',
      body:
        '当前笔记和当前文件夹画廊支持筛选、排序、网格/列表切换与灯箱预览，阅读视图里双击图片也能直接进入单图画廊。'
    },
    {
      eyebrow: 'Batch',
      title: '面向整个仓库的动作，也能带着刹车。',
      body:
        '整库命令前置风险确认，批量任务支持暂停、恢复与取消，减少“误触一次跑满全库”的心理负担。'
    },
    {
      eyebrow: 'Reliability',
      title: '路径兼容、重名处理和清理边界都考虑到了。',
      body:
        '支持中文与已编码路径混用，时间命名带顺序后缀去重，空目录清理只作用于图片附件目录，不误删笔记目录。'
    }
  ],
  install: {
    title: '从仓库到插件目录，路径很短。',
    snippet: ['npm install', 'npm run validate', 'npm run build'],
    note: '构建完成后，将 manifest.json、main.js 和 styles.css 复制到 Obsidian 插件目录即可。'
  }
} as const;
