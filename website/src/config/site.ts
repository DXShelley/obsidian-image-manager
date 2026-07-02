export type SiteLocale = 'zh-CN' | 'en';

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

interface SiteConfig {
  readonly locale: SiteLocale;
  readonly name: string;
  readonly version: string;
  readonly meta: {
    readonly title: string;
    readonly description: string;
  };
  readonly nav: {
    readonly ariaLabel: string;
    readonly items: readonly { readonly label: string; readonly href: string }[];
  };
  readonly languageSwitch: {
    readonly label: string;
    readonly options: Readonly<Record<SiteLocale, string>>;
  };
  readonly hero: {
    readonly badge: string;
    readonly title: string;
    readonly subtitle: string;
    readonly primaryCta: { readonly label: string; readonly href: string };
    readonly secondaryCta: { readonly label: string; readonly href: string };
    readonly panelTag: string;
    readonly panelTitle: string;
    readonly panelBody: string;
    readonly commandStrip: readonly string[];
    readonly railLabel: string;
    readonly railState: string;
    readonly railItems: readonly string[];
  };
  readonly stats: readonly { readonly value: string; readonly label: string }[];
  readonly sections: {
    readonly features: { readonly eyebrow: string; readonly title: string };
    readonly workflow: { readonly eyebrow: string; readonly title: string };
    readonly status: { readonly eyebrow: string; readonly title: string };
    readonly install: { readonly eyebrow: string };
    readonly support: { readonly eyebrow: string };
    readonly philosophy: { readonly eyebrow: string; readonly title: string };
  };
  readonly statusLabels: {
    readonly implemented: string;
    readonly planned: string;
  };
  readonly pillars: readonly FeatureItem[];
  readonly workflow: readonly {
    readonly step: string;
    readonly title: string;
    readonly description: string;
  }[];
  readonly status: readonly StatusItem[];
  readonly detailCards: readonly {
    readonly eyebrow: string;
    readonly title: string;
    readonly body: string;
  }[];
  readonly philosophy: {
    readonly quote: string;
    readonly body: string;
    readonly points: readonly string[];
  };
  readonly install: {
    readonly title: string;
    readonly snippet: readonly string[];
    readonly note: string;
  };
  readonly support: {
    readonly title: string;
    readonly body: string;
    readonly methods: readonly {
      readonly title: string;
      readonly description: string;
      readonly image: string;
      readonly alt: string;
    }[];
  };
}

const VERSION = 'v4.0.10';

const SITE_CONFIGS: Readonly<Record<SiteLocale, SiteConfig>> = {
  'zh-CN': {
    locale: 'zh-CN',
    name: 'Note Image Manager',
    version: VERSION,
    meta: {
      title: `Note Image Manager ${VERSION}`,
      description:
        '面向 Obsidian 的图片管理插件主页，聚焦够用实用的图片落盘、批量处理、恢复事务、画廊浏览与轻量编辑。'
    },
    nav: {
      ariaLabel: '站点导航',
      items: [
        { label: '核心能力', href: '#features' },
        { label: '处理流程', href: '#workflow' },
        { label: '功能状态', href: '#status' },
        { label: '开始使用', href: '#install' },
        { label: '支持项目', href: '#support' }
      ]
    },
    languageSwitch: {
      label: '语言',
      options: {
        'zh-CN': '中文',
        en: 'EN'
      }
    },
    hero: {
      badge: 'Obsidian 图片工作流',
      title: '把图片处理收敛成够用、顺手、可回退的一条链路。',
      subtitle:
        'Note Image Manager 关注真实写作场景里的图片导入、命名、转换、批处理与恢复，而不是用一堆零散开关堆出复杂度。',
      primaryCta: { label: '查看功能状态', href: '#status' },
      secondaryCta: { label: '浏览核心能力', href: '#features' },
      panelTag: '当前笔记',
      panelTitle: '从粘贴到整理，目录、文件名和链接格式都能保持可控。',
      panelBody: '受管目录、批处理、恢复事务与阅读画廊共同构成一套完整而克制的图片流转方案。',
      commandStrip: ['粘贴导入', '自动转换', '受管目录同步', '撤销 / 重做'],
      railLabel: '能力总览',
      railState: '已实现 / 规划中',
      railItems: ['当前图片 / 当前笔记 / 当前文件夹画廊', '轻量编辑与拖拽裁剪', '批量压缩、转换、链接整理', '去水印保留为规划功能']
    },
    stats: [
      { value: VERSION, label: '当前发布版本' },
      { value: '笔记 / 文件夹 / 整库', label: '批量处理范围' },
      { value: '撤销 / 重做', label: '恢复事务支持' }
    ],
    sections: {
      features: { eyebrow: '核心能力', title: '围绕 Obsidian 真实图片流转场景设计，而不是追求过度设计。' },
      workflow: { eyebrow: '处理流程', title: '导入、整理、批处理、回退，形成一条能长期维护的图片处理路径。' },
      status: { eyebrow: '功能状态', title: '已实现与规划中统一展示，主页口径直接对齐仓库状态。' },
      install: { eyebrow: '安装方式' },
      support: { eyebrow: '支持项目' },
      philosophy: { eyebrow: '设计取舍', title: '在 Obsidian 里做够用实用的图片工具，而不是继续制造熵。' }
    },
    statusLabels: {
      implemented: '已上线',
      planned: '规划中'
    },
    pillars: [
      {
        title: '受管目录与命名规则',
        description: '支持 `./assets/${noteFileName}` 这类按笔记组织的目录模板，并用变量生成稳定文件名。',
        meta: '导入 / 重命名 / 迁移'
      },
      {
        title: '批量处理先有边界再谈效率',
        description: '外部图片导入、压缩、转换、链接更新和清理都能作用于当前笔记、当前文件夹或整个仓库。',
        meta: '范围化批处理'
      },
      {
        title: '轻量编辑与单图导入双入口',
        description: '文件右键菜单负责本地图片编辑；阅读视图右键外部图片时，只导入当前这一张。',
        meta: '右键菜单编辑'
      },
      {
        title: '恢复事务是基础设施',
        description: '图片和 Markdown 的修改都会进入持久化恢复事务，支持撤销与重做最近的操作。',
        meta: '恢复优先'
      }
    ],
    workflow: [
      {
        step: '01',
        title: '导入图片',
        description: '粘贴图片或图片 URL，插件接管保存目录、格式与命名。'
      },
      {
        step: '02',
        title: '整理链接',
        description: '统一 Markdown / Wiki 链接风格，并兼容中文、空格、括号与编码路径。'
      },
      {
        step: '03',
        title: '批量处理',
        description: '在笔记、文件夹或整库范围执行外部图片导入、压缩、转换、迁移与清理。'
      },
      {
        step: '04',
        title: '可回退收尾',
        description: '图片修改纳入恢复事务，减少“一次操作全改坏”的风险。'
      }
    ],
    status: [
      {
        title: '增强画廊',
        description: '支持当前图片、当前笔记和当前文件夹画廊，并在阅读视图中双击图片直接打开。',
        status: 'implemented'
      },
      {
        title: '外部图片导入',
        description: '支持把 URL、file:// 与 data URL 图片导入本地，并在阅读视图中右键单张外部图片精确落盘。',
        status: 'implemented'
      },
      {
        title: '可恢复图片编辑',
        description: '旋转、翻转、压缩、转换和裁剪都纳入恢复事务。',
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
        title: '去水印 / 局部修复',
        description: '仅作为规划功能保留，待效果和交互达到可用标准后再恢复。',
        status: 'planned'
      },
      {
        title: 'OCR / 搜索 / 分类',
        description: '后续会把识别与检索能力引入图片工作流，而不止停留在存储与处理。',
        status: 'planned'
      },
      {
        title: 'Worker 后台处理',
        description: '计划把更重的批量任务转到后台执行，减少对前台交互的阻塞。',
        status: 'planned'
      }
    ],
    detailCards: [
      {
        eyebrow: '画廊',
        title: '图片浏览不再只靠文件树。',
        body: '当前笔记和当前文件夹画廊支持筛选、排序、网格/列表切换与灯箱预览。'
      },
      {
        eyebrow: '批处理',
        title: '面向整个仓库的动作，也要自带刹车。',
        body: '整库命令前置风险确认，批量任务支持暂停、恢复与取消，外部图片导入也会按范围单独执行。'
      },
      {
        eyebrow: '稳定性',
        title: '路径兼容、重名处理和清理边界都做了约束。',
        body: '支持中文与已编码路径混用，时间命名带顺序后缀去重，空目录清理只作用于图片附件目录。'
      }
    ],
    philosophy: {
      quote: '够用实用，用户体验好，但不拖泥带水。',
      body: '这个项目的取舍标准不是把图片能力做成“大而全”的平台，而是在 Obsidian 里把高频问题解决得稳定、清楚、可恢复，避免过度设计继续放大维护熵。',
      points: ['优先真实写作与整理场景', '优先低摩擦交互与明确边界', '不为概念完整性引入额外复杂度']
    },
    install: {
      title: '从仓库到插件目录，路径很短。',
      snippet: ['npm install', 'npm run validate', 'npm run build'],
      note: '社区市场审核通过后可直接从 Community Plugins 安装；在此之前可将 `manifest.json`、`main.js` 和 `styles.css` 手动复制到插件目录。'
    },
    support: {
      title: '如果它节省了你的图片整理时间，可以请我喝杯咖啡。',
      body: 'Note Image Manager 会继续保持免费和开源。赞助用于支持维护、测试、文档和后续功能迭代。',
      methods: [
        {
          title: '微信支付',
          description: '推荐使用微信支付扫码支持。',
          image: 'support/weixin.png',
          alt: '微信支付收款二维码'
        },
        {
          title: '微信赞赏码',
          description: '也可以通过微信赞赏码支持项目。',
          image: 'support/zanshangma.png',
          alt: '微信赞赏码'
        },
        {
          title: '支付宝',
          description: '打开支付宝扫一扫即可支持。',
          image: 'support/zhifubao.png',
          alt: '支付宝收款二维码'
        }
      ]
    }
  },
  en: {
    locale: 'en',
    name: 'Note Image Manager',
    version: VERSION,
    meta: {
      title: `Note Image Manager ${VERSION}`,
      description:
        'Landing page for an Obsidian image-management plugin focused on practical storage rules, batch jobs, recovery transactions, gallery browsing, and lightweight editing.'
    },
    nav: {
      ariaLabel: 'Site navigation',
      items: [
        { label: 'Features', href: '#features' },
        { label: 'Workflow', href: '#workflow' },
        { label: 'Status', href: '#status' },
        { label: 'Install', href: '#install' },
        { label: 'Support', href: '#support' }
      ]
    },
    languageSwitch: {
      label: 'Language',
      options: {
        'zh-CN': '中文',
        en: 'EN'
      }
    },
    hero: {
      badge: 'Image Workflows For Obsidian',
      title: 'Keep image operations practical, smooth, and reversible.',
      subtitle:
        'Note Image Manager focuses on the image flows people actually hit while writing: import, naming, conversion, batch cleanup, and safe rollback without piling on design entropy.',
      primaryCta: { label: 'View feature status', href: '#status' },
      secondaryCta: { label: 'Browse core features', href: '#features' },
      panelTag: 'Current Note',
      panelTitle: 'From paste to cleanup, folders, filenames, and links stay predictable.',
      panelBody: 'Managed folders, batch jobs, recovery transactions, and reading galleries form a complete but restrained image workflow.',
      commandStrip: ['Paste Import', 'Auto Convert', 'Managed Folder Sync', 'Undo / Redo'],
      railLabel: 'Feature Rail',
      railState: 'Shipped / Planned',
      railItems: ['Current image / note / folder galleries', 'Lightweight edits with drag crop', 'Batch compress, convert, and relink', 'Watermark removal stays planned']
    },
    stats: [
      { value: VERSION, label: 'Current release' },
      { value: 'Note / Folder / Vault', label: 'Batch scopes' },
      { value: 'Undo / Redo', label: 'Recovery transactions' }
    ],
    sections: {
      features: { eyebrow: 'Core Features', title: 'Designed around real Obsidian image flows instead of feature sprawl.' },
      workflow: { eyebrow: 'Workflow', title: 'Import, normalize, batch-process, and roll back with one maintainable path.' },
      status: { eyebrow: 'Feature Status', title: 'Shipped and planned work are shown together so the site matches the repo.' },
      install: { eyebrow: 'Install' },
      support: { eyebrow: 'Support' },
      philosophy: { eyebrow: 'Philosophy', title: 'Useful and pleasant in Obsidian, without dragging the project into entropy.' }
    },
    statusLabels: {
      implemented: 'Shipped',
      planned: 'Planned'
    },
    pillars: [
      {
        title: 'Managed folders and naming rules',
        description: 'Use note-scoped folder templates such as `./assets/${noteFileName}` and generate stable filenames from variables.',
        meta: 'Paste / Rename / Relocate'
      },
      {
        title: 'Batch jobs with explicit boundaries',
        description: 'Import external images, compress, convert, relink, and clean up within the current note, folder, or whole vault.',
        meta: 'Scoped Batch Jobs'
      },
      {
        title: 'Dual entry points for edits and import',
        description: 'Use the file menu for local image edits, and right-click rendered external images in reading view to import only the selected source.',
        meta: 'Context Menu Editing'
      },
      {
        title: 'Recovery is infrastructure',
        description: 'Image and Markdown changes are written into persistent transactions so undo and redo remain reliable.',
        meta: 'Recovery First'
      }
    ],
    workflow: [
      {
        step: '01',
        title: 'Import images',
        description: 'Paste images or image URLs and let the plugin take over storage, format, and naming rules.'
      },
      {
        step: '02',
        title: 'Normalize links',
        description: 'Keep Markdown and Wiki links consistent across encoded paths, spaces, parentheses, and Chinese filenames.'
      },
      {
        step: '03',
        title: 'Run batch tasks',
        description: 'Import external images, compress, convert, relocate, and clean images within a note, folder, or the entire vault.'
      },
      {
        step: '04',
        title: 'Roll back safely',
        description: 'Image changes land in recovery transactions so one bad run does not leave the vault stuck.'
      }
    ],
    status: [
      {
        title: 'Expanded gallery',
        description: 'Open galleries for the current image, note, or folder, including reading-view double-click entry.',
        status: 'implemented'
      },
      {
        title: 'External image import',
        description: 'Import URL, file://, and data URL images into the vault, including precise single-image import from the reading-view context menu.',
        status: 'implemented'
      },
      {
        title: 'Recoverable image editing',
        description: 'Rotate, flip, compress, convert, and crop all participate in recovery transactions.',
        status: 'implemented'
      },
      {
        title: 'Managed-folder sync',
        description: 'When notes move or rename, managed image folders can move with them and rename files by rule.',
        status: 'implemented'
      },
      {
        title: 'Smarter orphan handling',
        description: 'Images with a single external reference are moved into the matching note scope instead of being deleted blindly.',
        status: 'implemented'
      },
      {
        title: 'Editor drag resize',
        description: 'Direct drag-to-resize inside the editor is still planned.',
        status: 'planned'
      },
      {
        title: 'Watermark removal / object repair',
        description: 'Kept only as a planned capability until output quality and interaction reach a practical bar.',
        status: 'planned'
      },
      {
        title: 'OCR / search / categorization',
        description: 'Image recognition and retrieval are planned for later instead of stopping at storage and conversion.',
        status: 'planned'
      },
      {
        title: 'Background workers',
        description: 'Heavier batch jobs are planned for background execution to reduce UI blocking.',
        status: 'planned'
      }
    ],
    detailCards: [
      {
        eyebrow: 'Gallery',
        title: 'Image browsing should not depend on the file tree alone.',
        body: 'Note-level and folder-level galleries include filtering, sorting, layout switching, and lightbox preview.'
      },
      {
        eyebrow: 'Batch',
        title: 'Vault-wide actions need brakes.',
        body: 'Whole-vault commands ask for risk confirmation first, and external-image import still runs as its own scoped operation.'
      },
      {
        eyebrow: 'Reliability',
        title: 'Path edge cases and cleanup boundaries are deliberate.',
        body: 'Encoded paths, naming collisions, and empty-folder cleanup are all constrained so routine use stays predictable.'
      }
    ],
    philosophy: {
      quote: 'Useful enough, pleasant enough, and no unnecessary drag.',
      body: 'The goal is not to build an all-encompassing image platform inside Obsidian. The goal is to solve high-frequency image problems clearly, safely, and with minimal friction, while avoiding entropy from over-design.',
      points: ['Optimize for real writing and organization flows', 'Prefer low-friction interactions with clear boundaries', 'Do not add complexity just to complete a concept map']
    },
    install: {
      title: 'The path from repo to plugin folder is short.',
      snippet: ['npm install', 'npm run validate', 'npm run build'],
      note: 'Install from Community Plugins after review approval, or manually copy `manifest.json`, `main.js`, and `styles.css` into the plugin directory before then.'
    },
    support: {
      title: 'If it saved you time managing images, you can support the project.',
      body: 'Note Image Manager will remain free and open source. Sponsorship helps cover maintenance, testing, documentation, and future feature work.',
      methods: [
        {
          title: 'WeChat Pay',
          description: 'Scan with WeChat Pay to support the project.',
          image: 'support/weixin.png',
          alt: 'WeChat Pay QR code'
        },
        {
          title: 'WeChat Reward Code',
          description: 'You can also support through the WeChat reward code.',
          image: 'support/zanshangma.png',
          alt: 'WeChat reward QR code'
        },
        {
          title: 'Alipay',
          description: 'Scan with Alipay to support the project.',
          image: 'support/zhifubao.png',
          alt: 'Alipay QR code'
        }
      ]
    }
  }
};

export function getSiteConfig(locale: SiteLocale): SiteConfig {
  return SITE_CONFIGS[locale];
}
