import fs from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'node-html-parser';

export const categories = [
  { id: 'big', label: '大作文', description: '材料作文、图画作文与社会现象真题' },
  { id: 'small', label: '小作文', description: '书信、通知与应用文写作模板' },
  { id: 'material', label: '语料模板', description: '分类语料、通用框架与主题名言' },
];

export const catalog = [
  {
    id: 'material-essay', slug: 'material-essay', title: '材料作文', category: 'big', type: '真题与框架',
    source: 'content/01-da-zuo-wen/01-cailiao-zuowen.html',
    description: '材料作文审题、立场选择、核心论述与结尾迁移框架。',
    tags: ['材料作文', '论述框架', '结尾段'], years: [2012, 2018, 2019], featured: true,
  },
  {
    id: 'picture-character', slug: 'picture-character', title: '图画作文与个人品质', category: 'big', type: '历年真题',
    source: 'content/01-da-zuo-wen/02-tupian-zuowen.html',
    description: '图画描述方法，以及自信、合作、自律等个人品质主题范文。',
    tags: ['图画作文', '个人品质', '范文'], years: [2007, 2008, 2012, 2013, 2014, 2016, 2017, 2018, 2019, 2020], featured: true,
  },
  {
    id: 'social-topics', slug: 'social-topics', title: '社会现象真题', category: 'big', type: '历年真题',
    source: 'content/01-da-zuo-wen/03-shehui-xianxiang.html',
    description: '科技、养老、文化与社会趋势等主题的审题思路和范文。',
    tags: ['社会现象', '图画作文', '范文'], years: [2005, 2006, 2009, 2011, 2015, 2020, 2021, 2022, 2023, 2024], featured: true,
  },
  {
    id: 'topic-corpus', slug: 'topic-corpus', title: '分类语料库', category: 'material', type: '语料',
    source: 'content/01-da-zuo-wen/04-yuliao.html',
    description: '亲子关系、个人发展、社会责任等主题的可迁移表达。',
    tags: ['分类语料', '主题表达', '迁移'], years: [2005, 2014, 2016], featured: true,
  },
  {
    id: 'recommendation-letter', slug: 'recommendation-letter', title: '推荐信', category: 'small', type: '应用文',
    source: 'content/02-xiao-zuo-wen/01-tuijianxin.html',
    description: '推荐信的写信目的、推荐理由、结尾表达及真题范文。',
    tags: ['推荐信', '书信', '模板'], years: [2011, 2015, 2017], featured: true,
  },
  {
    id: 'advice-letter', slug: 'advice-letter', title: '建议信', category: 'small', type: '应用文',
    source: 'content/02-xiao-zuo-wen/02-jianyixin.html',
    description: '面向个人或机构提出建议时的结构、常用句式与范文。',
    tags: ['建议信', '书信', '模板'], years: [2012, 2024], featured: true,
  },
  {
    id: 'invitation-letter', slug: 'invitation-letter', title: '邀请信', category: 'small', type: '应用文',
    source: 'content/02-xiao-zuo-wen/03-yaoqingxin.html',
    description: '邀请目的、时间地点、活动流程和活动价值的表达。',
    tags: ['邀请信', '书信', '活动'], years: [2018, 2022, 2024], featured: false,
  },
  {
    id: 'notice', slug: 'notice', title: '通知', category: 'small', type: '应用文',
    source: 'content/02-xiao-zuo-wen/04-tongzhi.html',
    description: '活动通知与事务通知的结构、流程表达及真题范文。',
    tags: ['通知', '活动', '应用文'], years: [2016, 2019, 2020, 2023, 2024], featured: false,
  },
  {
    id: 'reply-letter', slug: 'reply-letter', title: '答复信与回复邮件', category: 'small', type: '应用文',
    source: 'content/02-xiao-zuo-wen/05-dafu-xin.html',
    description: '回复邮件的审题思路、信息组织和示例。',
    tags: ['答复信', '邮件', '真题'], years: [2024], featured: false,
  },
  {
    id: 'essay-template', slug: 'essay-template', title: '大作文通用模板', category: 'material', type: '模板',
    source: 'content/04-da-zuo-wen-mo-ban/01-moban.html',
    description: '单图、对话图和双图作文的通用描述模板。',
    tags: ['大作文', '通用模板', '图画描述'], years: [], featured: true,
  },
  {
    id: 'quotes', slug: 'quotes', title: '主题升华名言', category: 'material', type: '语料',
    source: 'content/05-mingyan/01-mingyan.html',
    description: '用于结尾升华和主题论证的名言表达素材。',
    tags: ['名言', '结尾', '主题升华'], years: [], featured: false,
  },
  {
    id: 'seven-five', slug: 'seven-five', title: '七选五方法与排序题', category: 'extra', type: '附加资料',
    source: 'content/03-qi-wu-xuan-yi/01-jiefang.html',
    description: '七选五和排序题的快速解题步骤。',
    tags: ['七选五', '排序题', '阅读'], years: [], featured: false,
  },
];

export function normalizeSearch(value = '') {
  return value.normalize('NFKC').toLocaleLowerCase('zh-CN').replace(/\s+/g, ' ').trim();
}

function languageClass(text) {
  const latin = (text.match(/[A-Za-z]/g) || []).length;
  const han = (text.match(/[\u3400-\u9fff]/g) || []).length;
  if (latin > 8 && latin > han * 1.7) return 'lang-en';
  if (han > 4 && han > latin * 0.55) return 'lang-zh';
  return 'lang-mixed';
}

function cleanText(value) {
  return value
    .replace(/Copyright\s*©\s*2024\s*大道至简Loru\.?(?:\s*All Rights Reserved\.)?/gi, '')
    .replace(/(?:^|\s)\d{1,2}\/37(?:\s|$)/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\s+([，。！？；：,.!?;:])/g, '$1')
    .trim();
}

export async function loadEntry(entry, rootDir = process.cwd()) {
  const filename = path.join(rootDir, entry.source);
  const raw = await fs.readFile(filename, 'utf8');
  const editoriallyCleaned = raw
    .replace(/模版/g, '模板')
    .replace(/答复信&gt;/g, '答复信')
    .replace(/正如上面的图片中象征性抽的那样\./g, '正如上图所象征性地描绘的那样。')
    .replace(/请不要犹豫与<\/p>\s*<h2[^>]*>\s*<span class="citation"[^>]*>@大道至简Loru<\/span>\s*<\/h2>\s*<p>我联系。/gi, '请不要犹豫与我联系。')
    .replace(/Copyright\s*©\s*2024\s*大道至简Loru\.?(?:\s*All Rights Reserved\.)?/gi, '')
    .replace(/(?:>|\s)\d{1,2}\/37(?=<|\s)/g, (match) => match.startsWith('>') ? '>' : ' ')
    .replace(/<span class="citation"[^>]*>@大道至简Loru<\/span>/gi, '');
  const document = parse(editoriallyCleaned, { comment: false });
  const main = document.querySelector('main');
  if (!main) throw new Error(`${entry.source}: missing <main>`);

  main.querySelectorAll('script, style').forEach((node) => node.remove());
  main.querySelectorAll('ol, ul').forEach((list) => {
    if (/^\d{1,2}$/.test(cleanText(list.text))) list.remove();
  });
  main.querySelectorAll('h1').forEach((node) => {
    if (cleanText(node.text) === entry.title) node.remove();
    else node.tagName = 'H2';
  });
  main.querySelectorAll('h2').forEach((heading, index) => {
    const title = cleanText(heading.text).replace(/^▼\s*/, '').replace(/^[-–—]\s*/, '');
    if (!title || /^@大道至简/i.test(title)) {
      heading.remove();
      return;
    }
    heading.set_content(title);
    heading.setAttribute('id', `${entry.slug}-section-${index + 1}`);
  });
  main.querySelectorAll('p, li, td, blockquote').forEach((node) => {
    const text = cleanText(node.text);
    if (!text) {
      if (!node.querySelector('img')) node.remove();
      return;
    }
    node.classList.add('study-block');
    node.classList.add(languageClass(text));
  });
  main.querySelectorAll('img').forEach((image) => {
    const src = image.getAttribute('src') || '';
    image.setAttribute('src', src.replace(/^.*assets\/images\//, '/images/'));
    image.setAttribute('loading', 'lazy');
    image.setAttribute('decoding', 'async');
    image.setAttribute('alt', `${entry.title}配图`);
    const parent = image.parentNode;
    if (parent) parent.classList.add('figure-block');
  });
  main.querySelectorAll('a').forEach((anchor) => {
    const href = anchor.getAttribute('href') || '';
    if (/^https?:/.test(href)) {
      anchor.setAttribute('target', '_blank');
      anchor.setAttribute('rel', 'noreferrer');
    }
  });

  const text = cleanText(main.text);
  const headings = main.querySelectorAll('h2').map((heading) => ({
    id: heading.getAttribute('id'),
    title: cleanText(heading.text),
  })).filter((item) => item.title);
  const imagePaths = main.querySelectorAll('img').map((image) => image.getAttribute('src'));

  return {
    ...entry,
    html: main.innerHTML,
    plainText: text,
    headings,
    imagePaths,
    wordCount: (text.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g) || []).length,
    reviewStatus: 'reviewed',
  };
}

export async function loadCatalog(rootDir = process.cwd()) {
  return Promise.all(catalog.map((entry) => loadEntry(entry, rootDir)));
}

export function categoryLabel(category) {
  return categories.find((item) => item.id === category)?.label || '附加资料';
}
