import React from 'react';

interface CardProps {
  title: string;
  description: string;
  imageUrl: string;
}

const Card: React.FC<CardProps> = ({ title, description, imageUrl }) => (
  <div className="bg-white dark:bg-neutral-800/50 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
    <img className="h-48 w-full object-cover" src={imageUrl} alt={title} />
    <div className="p-6">
      <div className="uppercase tracking-wide text-sm text-primary font-semibold">{title}</div>
      <p className="mt-2 text-neutral-500 dark:text-neutral-400">{description}</p>
    </div>
  </div>
);

export default Card;
