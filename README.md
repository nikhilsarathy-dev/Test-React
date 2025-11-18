# Australian Parent Visa Planner

Interactive timeline tool for planning parent visa visits with rolling 18-month window validation.

## Features

- **Interactive Timeline**: Drag-and-drop interface to plan multiple visits
- **Real-time Validation**: Automatically validates against the 12-month per 18-month rule
- **Mobile Responsive**: Optimized for both desktop and mobile devices (iOS & Android)
- **Rolling Window Visualization**: See the critical 18-month window on the timeline
- **Compact Dashboard**: Sticky validation dashboard that stays visible while planning

## Quick Start

### Running with Docker (Recommended)

```bash
# Build and run with docker-compose
docker-compose up -d

# Access the app at http://localhost:3000
```

### Running with npm

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

## Requirements

- **Visa Type**: Visitor Visa (Subclass 600) - Tourist Stream
- **Condition 8558**: Maximum 12 months stay in any rolling 18-month period
- **Visa Validity**: October 1, 2024 - September 30, 2027

## How to Use

1. **View Current Plan**: Two stays are pre-loaded based on actual history
2. **Add New Visit**: Click "➕ Add Visit" to add a new planned stay
3. **Adjust Dates**:
   - Drag the entire bar to move the visit
   - Drag the handles (⫷ ⫸) to adjust start/end dates
4. **Monitor Validation**: Dashboard shows real-time validation status
5. **Visualize Windows**: Click window cards to see different 18-month periods
6. **Delete Visits**: Click the ✕ button on editable visits

## Technology Stack

- **React** 18.2.0
- **Docker** for containerization
- **Nginx** for production serving

## Mobile Optimization

- Responsive design for all screen sizes
- Touch-friendly drag-and-drop
- Optimized for both portrait and landscape orientations
- Works seamlessly on iOS and Android devices

## License

Private use only.
