import { PackageX, ShoppingBag, FileX, Users } from 'lucide-react';

const iconMap = {
  products: ShoppingBag,
  orders: FileX,
  deliveries: PackageX,
  partners: Users,
  default: PackageX,
};

const EmptyState = ({
  type = 'default',
  title = 'Nothing here yet',
  description = 'There is no data to display.',
  action,
}) => {
  const Icon = iconMap[type] || iconMap.default;

  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-fade-in">
      <div className="w-20 h-20 rounded-2xl bg-primary-50 flex items-center justify-center mb-5">
        <Icon className="w-10 h-10 text-primary-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-500 text-sm max-w-xs mb-6">{description}</p>
      {action && action}
    </div>
  );
};

export default EmptyState;
