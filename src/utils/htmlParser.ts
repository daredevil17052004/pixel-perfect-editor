import { ElementNode, DesignDocument } from '@/types/editor';

let idCounter = 0;

function generateId(): string {
  return `el-${++idCounter}`;
}

function parseStyles(styleString: string): Record<string, string> {
  const styles: Record<string, string> = {};
  if (!styleString) return styles;
  
  const declarations = styleString.split(';');
  for (const declaration of declarations) {
    const [property, value] = declaration.split(':').map((s) => s.trim());
    if (property && value) {
      styles[property] = value;
    }
  }
  return styles;
}

function parseElement(element: Element, parentId?: string): ElementNode {
  const id = generateId();
  const attributes: Record<string, string> = {};
  
  for (const attr of Array.from(element.attributes)) {
    if (attr.name !== 'style' && attr.name !== 'data-editor-id') {
      attributes[attr.name] = attr.value;
    }
  }

  const computedStyle = window.getComputedStyle(element);
  const inlineStyle = element.getAttribute('style') || '';
  const styles = parseStyles(inlineStyle);

  const children: ElementNode[] = [];
  
  for (const child of Array.from(element.childNodes)) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      children.push(parseElement(child as Element, id));
    } else if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent?.trim();
      if (text) {
        children.push({
          id: generateId(),
          tagName: '#text',
          attributes: {},
          styles: {},
          children: [],
          textContent: text,
          isTextNode: true,
          parentId: id,
        });
      }
    }
  }

  return {
    id,
    tagName: element.tagName.toLowerCase(),
    attributes,
    styles,
    children,
    parentId,
  };
}

export function parseHTML(htmlString: string): DesignDocument {
  idCounter = 0;
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');
  
  // Extract styles
  const styleElements = doc.querySelectorAll('style');
  let styles = '';
  const fonts: string[] = [];
  
  styleElements.forEach((style) => {
    const content = style.textContent || '';
    styles += content;
    
    // Extract font imports
    const fontImports = content.match(/@import url\(['"](.*?)['"]\)/g);
    if (fontImports) {
      fonts.push(...fontImports);
    }
  });
  
  // Extract link fonts
  const linkElements = doc.querySelectorAll('link[href*="fonts"]');
  linkElements.forEach((link) => {
    const href = link.getAttribute('href');
    if (href) {
      fonts.push(`@import url('${href}')`);
    }
  });

  // Parse body content
  const body = doc.body;
  const elements: ElementNode[] = [];
  
  for (const child of Array.from(body.children)) {
    elements.push(parseElement(child));
  }

  // Try to determine dimensions from the first container
  let width = 800;
  let height = 600;
  
  if (elements.length > 0) {
    const firstEl = doc.body.firstElementChild;
    if (firstEl) {
      const style = firstEl.getAttribute('style') || '';
      const widthMatch = style.match(/max-width:\s*(\d+)px/);
      const aspectMatch = style.match(/aspect-ratio:\s*(\d+)\/(\d+)/);
      
      if (widthMatch) {
        width = parseInt(widthMatch[1], 10);
      }
      if (aspectMatch) {
        const w = parseInt(aspectMatch[1], 10);
        const h = parseInt(aspectMatch[2], 10);
        height = Math.round(width * (h / w));
      }
    }
  }

  return {
    id: generateId(),
    name: doc.title || 'Untitled Design',
    width,
    height,
    elements,
    styles,
    fonts,
  };
}

export function elementsToHTML(elements: ElementNode[], includeEditorIds = false): string {
  const renderNode = (node: ElementNode): string => {
    if (node.isTextNode) {
      return node.textContent || '';
    }

    const attrs = Object.entries(node.attributes)
      .map(([key, value]) => `${key}="${value}"`)
      .join(' ');

    const styleStr = Object.entries(node.styles)
      .map(([key, value]) => `${key}: ${value}`)
      .join('; ');

    const editorId = includeEditorIds ? ` data-editor-id="${node.id}"` : '';
    const styleAttr = styleStr ? ` style="${styleStr}"` : '';

    const children = node.children.map(renderNode).join('');

    const selfClosingTags = ['img', 'br', 'hr', 'input', 'meta', 'link'];
    if (selfClosingTags.includes(node.tagName)) {
      return `<${node.tagName}${attrs ? ' ' + attrs : ''}${styleAttr}${editorId} />`;
    }

    return `<${node.tagName}${attrs ? ' ' + attrs : ''}${styleAttr}${editorId}>${children}</${node.tagName}>`;
  };

  return elements.map(renderNode).join('');
}

export function findElementById(elements: ElementNode[], id: string): ElementNode | null {
  for (const element of elements) {
    if (element.id === id) {
      return element;
    }
    if (element.children.length > 0) {
      const found = findElementById(element.children, id);
      if (found) return found;
    }
  }
  return null;
}

export function flattenElements(elements: ElementNode[]): ElementNode[] {
  const result: ElementNode[] = [];
  
  const traverse = (nodes: ElementNode[]) => {
    for (const node of nodes) {
      result.push(node);
      if (node.children.length > 0) {
        traverse(node.children);
      }
    }
  };
  
  traverse(elements);
  return result;
}
