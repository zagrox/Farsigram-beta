import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface ApiCategory {
  id: number;
  status: string;
  category_parent: string; // This is the name
  category_name: number | null; // This is the parent_id
  category_image: string | null;
  category_color: string | null;
}

interface ParentCategory extends ApiCategory {
  subcategories: ApiCategory[];
}

const hexToRgba = (hex: string | null, alpha: number): string => {
  if (!hex || !/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
    // Return a default color if hex is invalid or null
    const defaultRgb = '204, 204, 204'; // A neutral gray
    return `rgba(${defaultRgb}, ${alpha})`;
  }

  let c: any = hex.substring(1).split('');
  if (c.length === 3) {
    c = [c[0], c[0], c[1], c[1], c[2], c[2]];
  }
  c = '0x' + c.join('');
  return `rgba(${(c >> 16) & 255}, ${(c >> 8) & 255}, ${c & 255}, ${alpha})`;
};


const CategoriesPage: React.FC = () => {
  const { t } = useTranslation('categories');
  const [structuredCategories, setStructuredCategories] = useState<ParentCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('https://crm.farsigram.com/items/categories');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        
        const publishedCategories: ApiCategory[] = data.data.filter(
          (cat: ApiCategory) => cat.status === 'published'
        );

        const parents: ParentCategory[] = publishedCategories
          .filter((cat) => cat.category_name === null)
          .map((cat) => ({ ...cat, subcategories: [] }));

        const subcategories: ApiCategory[] = publishedCategories.filter(
          (cat) => cat.category_name !== null
        );

        const categoriesMap = new Map<number, ParentCategory>();
        parents.forEach(p => categoriesMap.set(p.id, p));

        subcategories.forEach(sub => {
          const parent = categoriesMap.get(sub.category_name!);
          if (parent) {
            parent.subcategories.push(sub);
          }
        });

        setStructuredCategories(Array.from(categoriesMap.values()));
      } catch (err) {
        setError(t('error'));
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [t]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">{t('title')}</h1>
        <p className="mt-2 text-lg text-neutral-600 dark:text-neutral-400">{t('subtitle')}</p>
      </div>
      
      {loading && <p className="text-center text-neutral-500 dark:text-neutral-400">{t('loading')}</p>}
      {error && <p className="text-center text-red-500">{error}</p>}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {structuredCategories.map((parent) => (
            <div 
              key={parent.id} 
              className="bg-white dark:bg-neutral-800/50 rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            >
              <div 
                className="p-4 flex items-center gap-4"
                style={{ backgroundColor: hexToRgba(parent.category_color, 0.1) }}
              >
                {parent.category_image && (
                   <div 
                    className="w-12 h-12 rounded-full flex-shrink-0 bg-white dark:bg-neutral-800 p-1 flex items-center justify-center"
                    style={{ border: `2px solid ${parent.category_color || '#cccccc'}` }}
                   >
                    <img 
                      src={`https://crm.farsigram.com/assets/${parent.category_image}`} 
                      alt={parent.category_parent}
                      className="w-10 h-10 object-contain"
                    />
                   </div>
                )}
                <h3 
                  className="text-lg font-bold"
                  style={{ color: parent.category_color || 'inherit' }}
                >
                  {parent.category_parent}
                </h3>
              </div>
              <div className="p-6">
                {parent.subcategories.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {parent.subcategories.map((sub) => (
                      <span
                        key={sub.id}
                        className="text-sm text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-700/50 px-3 py-1 rounded-full cursor-pointer transition-colors hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20"
                      >
                        {sub.category_parent}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-neutral-400 dark:text-neutral-500 italic">{t('noSubcategories')}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoriesPage;