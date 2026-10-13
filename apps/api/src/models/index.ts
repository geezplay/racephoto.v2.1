import { User } from './User';
import { Event } from './Event';
import { EventClass } from './EventClass';
import { Photo } from './Photo';
import { RecapPhoto } from './RecapPhoto';
import { Order } from './Order';
import { OrderItem } from './OrderItem';
import { Sponsor } from './Sponsor';
import { Photographer } from './Photographer';
import { WithdrawalRequest } from './WithdrawalRequest';
import { SiteSetting } from './SiteSetting';
import { DiscountCode } from './DiscountCode';

// User -> Event (creator)
User.hasMany(Event, { foreignKey: 'created_by', as: 'events' });
Event.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// Event -> EventClass
Event.hasMany(EventClass, { foreignKey: 'event_id', as: 'classes' });
EventClass.belongsTo(Event, { foreignKey: 'event_id', as: 'event' });

// Event -> Photo
Event.hasMany(Photo, { foreignKey: 'event_id', as: 'photos' });
Photo.belongsTo(Event, { foreignKey: 'event_id', as: 'event' });

// User -> Photo (creator)
User.hasMany(Photo, { foreignKey: 'created_by', as: 'photos' });
Photo.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// Photo -> RecapPhoto
Photo.hasMany(RecapPhoto, { foreignKey: 'photo_id', as: 'recaps' });
RecapPhoto.belongsTo(Photo, { foreignKey: 'photo_id', as: 'photo' });

// User -> Order (buyer)
User.hasMany(Order, { foreignKey: 'user_id', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'user_id', as: 'buyer' });

// Order -> OrderItem
Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

// Photo -> OrderItem
Photo.hasMany(OrderItem, { foreignKey: 'photo_id', as: 'orderItems' });
OrderItem.belongsTo(Photo, { foreignKey: 'photo_id', as: 'photo' });

// User -> WithdrawalRequest
User.hasMany(WithdrawalRequest, { foreignKey: 'user_id', as: 'withdrawals' });
WithdrawalRequest.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Processed by relation
User.hasMany(WithdrawalRequest, { foreignKey: 'processed_by', as: 'processedWithdrawals' });
WithdrawalRequest.belongsTo(User, { foreignKey: 'processed_by', as: 'processor' });

export {
  User,
  Event,
  EventClass,
  Photo,
  RecapPhoto,
  Order,
  OrderItem,
  Sponsor,
  Photographer,
  WithdrawalRequest,
  SiteSetting,
  DiscountCode,
};
