import { Order } from '../../orders/entities/order.entity';
import { SelectedOption } from '../../orders/entities/order-item.entity';
import { Period } from '../entities/period.entity';

interface CustomizationVariant {
  customizationKey: string;
  quantity: number;
}

interface ArticleSummary {
  articleId: string;
  articleName: string;
  totalQuantity: number;
  unitMeasure?: string;
  variants: CustomizationVariant[];
}

function formatCustomizationValue(option: SelectedOption): string {
  const type = option.type || 'string';
  const value = option.value;

  if (type === 'boolean') {
    return value ? 'Sí' : 'No';
  }
  if (type === 'multiselect' && Array.isArray(value)) {
    return value.join(', ');
  }
  if (value === null || value === undefined) {
    return '-';
  }
  return String(value);
}

function buildArticleName(item: Order['items'][number]): string {
  const articleId = item.articleId || '';
  if (!item.article) {
    return `Article ${articleId}`;
  }

  const parts: string[] = [];
  if (item.article.category) parts.push(item.article.category);
  if (item.article.product) parts.push(item.article.product);
  if (item.article.variety) parts.push(item.article.variety);

  return parts.length > 0 ? parts.join(' - ') : `Article ${articleId}`;
}

function buildCustomizationKey(selectedOptions?: SelectedOption[]): string {
  if (!selectedOptions?.length) {
    return '';
  }

  const sortedOptions = [...selectedOptions].sort((a, b) =>
    (a.title || '').localeCompare(b.title || ''),
  );

  return sortedOptions
    .map((option) => {
      const optionTitle = option.title || 'Personalització';
      return `${optionTitle}: ${formatCustomizationValue(option)}`;
    })
    .join(' | ');
}

export function buildPeriodOrdersSummary(period: Period, orders: Order[]): ArticleSummary[] {
  const periodArticleIds = new Set(
    (period.periodArticles || []).map((pa) => pa.articleId),
  );

  const periodStart = new Date(period.startDate);
  const periodEnd = new Date(period.endDate);
  periodEnd.setHours(23, 59, 59, 999);

  const periodOrders = orders.filter((order) => {
    const orderDate = new Date(order.createdAt);
    return orderDate >= periodStart && orderDate <= periodEnd;
  });

  const articlesMap = new Map<string, ArticleSummary>();
  const variantsMap = new Map<string, Map<string, number>>();

  for (const order of periodOrders) {
    for (const item of order.items || []) {
      if (!item.articleId || !periodArticleIds.has(item.articleId)) {
        continue;
      }

      const articleId = item.articleId;
      const articleName = buildArticleName(item);
      const quantity = Number(item.quantity);

      if (!articlesMap.has(articleId)) {
        articlesMap.set(articleId, {
          articleId,
          articleName,
          totalQuantity: 0,
          unitMeasure: item.article?.unitMeasure,
          variants: [],
        });
        variantsMap.set(articleId, new Map());
      }

      const summary = articlesMap.get(articleId)!;
      summary.totalQuantity += quantity;

      const customizationKey = buildCustomizationKey(item.selectedOptions);
      const articleVariants = variantsMap.get(articleId)!;
      articleVariants.set(
        customizationKey,
        (articleVariants.get(customizationKey) || 0) + quantity,
      );
    }
  }

  const result = Array.from(articlesMap.values());

  for (const summary of result) {
    const articleVariants = variantsMap.get(summary.articleId);
    if (articleVariants && articleVariants.size > 0) {
      summary.variants = Array.from(articleVariants.entries()).map(([key, qty]) => ({
        customizationKey: key,
        quantity: qty,
      }));
    }
  }

  return result.sort((a, b) => a.articleName.localeCompare(b.articleName));
}

export function formatPeriodOrdersSummaryText(articles: ArticleSummary[]): string {
  const lines: string[] = [];

  for (const article of articles) {
    const unit = article.unitMeasure ? ` ${article.unitMeasure}` : '';
    const variantsWithCustomizations = article.variants.filter(
      (v) => v.customizationKey && v.customizationKey !== '',
    );

    if (variantsWithCustomizations.length === 0) {
      lines.push(`${article.articleName}. Total ${article.totalQuantity}${unit}`);
      continue;
    }

    const optionGroups = new Map<string, Map<string, number>>();

    for (const variant of variantsWithCustomizations) {
      const optionPairs = variant.customizationKey.split(' | ');

      for (const pair of optionPairs) {
        const colonIndex = pair.indexOf(': ');
        if (colonIndex === -1) continue;

        const optionTitle = pair.substring(0, colonIndex).trim();
        const optionValue = pair.substring(colonIndex + 2).trim();
        if (!optionTitle || !optionValue) continue;

        if (!optionGroups.has(optionTitle)) {
          optionGroups.set(optionTitle, new Map());
        }

        const valueMap = optionGroups.get(optionTitle)!;
        valueMap.set(optionValue, (valueMap.get(optionValue) || 0) + variant.quantity);
      }
    }

    let line = article.articleName;
    const customizationParts: string[] = [];
    const sortedOptions = Array.from(optionGroups.entries()).sort((a, b) =>
      a[0].localeCompare(b[0]),
    );

    for (const [optionTitle, valueMap] of sortedOptions) {
      const sortedValues = Array.from(valueMap.entries()).sort((a, b) => {
        if (a[0] === 'Sí') return -1;
        if (b[0] === 'Sí') return 1;
        if (a[0] === 'No') return -1;
        if (b[0] === 'No') return 1;
        return a[0].localeCompare(b[0]);
      });

      const valueParts = sortedValues.map(([value, qty]) => `${value}: ${qty}`);
      customizationParts.push(`${optionTitle} ${valueParts.join('; ')}`);
    }

    if (customizationParts.length > 0) {
      line += `. ${customizationParts.join('. ')}`;
    }

    line += `. Total ${article.totalQuantity}${unit}`;
    lines.push(line);
  }

  return lines.join('\n');
}

export function formatDateCa(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ca-ES');
}
