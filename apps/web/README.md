# RacePhoto MERN Frontend

## Setup

1. Install dependencies:
```bash
npm install
```

2. Run development server:
```bash
npm run dev
```

The frontend will run on http://localhost:5173 and proxy API requests to http://localhost:5000

## Pages

### Public
- `/` - Home (events, photographers, sponsors)
- `/event/:id` - Event detail with class selection
- `/event/:eventId/class/:className` - Photo catalog
- `/cart` - Shopping cart
- `/payment` - Checkout with DOKU
- `/success` - Order confirmation

### Admin
- `/login` - Admin login
- `/admin` - Dashboard
- `/admin/events/create` - Create event
- `/admin/events/:id/edit` - Edit event
- `/admin/photos/create` - Upload photo
- `/admin/transactions` - View transactions
- `/admin/balance` - View balance & request withdrawal

### Super Admin Only
- `/admin/pending-events` - Approve/reject events
- `/admin/users` - Manage admins
- `/admin/sponsors` - Manage sponsors
- `/admin/photographers` - Manage photographers
- `/admin/settings` - Site settings
- `/admin/withdrawals` - Manage withdrawal requests
