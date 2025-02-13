# **Project Documentation: Full Stack Web Application for Plot Management**

---

## **Overview**
This project is a **Full Stack Web Application** designed to manage agricultural plots (polygons) on a map. Users can draw plots, save them to a database, retrieve and display saved plots, and perform CRUD (Create, Read, Update, Delete) operations on them. The application integrates **React** for the frontend, **Django** for the backend, **PostgreSQL** for the database, and **Mapbox** for map rendering and interaction.

---

## **Key Features**
1. **Draw Plots on Map**:
   - Users can draw polygons (plots) on the map using the **Mapbox Draw** tool.
   - The application validates the polygon to ensure it is closed, has at least 3 points, and does not intersect itself.

2. **Save Plots**:
   - Users can save the drawn plots to a **PostgreSQL** database.
   - Each plot is stored with its name, coordinates (polygon geometry), area, exploitation name, and crop type.

3. **Retrieve and Display Plots**:
   - Saved plots are retrieved from the database and displayed in a list on the sidebar.
   - Users can select a plot from the list to zoom and center the map on that plot.

4. **Edit and Delete Plots**:
   - Users can edit the details of a plot (name, crop type, etc.) or delete it entirely.

5. **Map Interaction**:
   - The map uses **Mapbox GL JS** for rendering and interaction.
   - When a plot is selected, the map zooms to fit the entire plot within the viewport.

6. **Responsive UI**:
   - The frontend is built using **Material-UI** for a clean and responsive user interface.

---

## **Technologies Used**
### **Frontend**
- **React**: A JavaScript library for building the user interface.
- **React Map GL**: A wrapper for Mapbox GL JS to integrate maps into React.
- **Mapbox Draw**: A library for drawing and editing polygons on the map.
- **Material-UI**: A React component library for designing the UI.
- **Axios**: For making HTTP requests to the backend.

### **Backend**
- **Django**: A Python web framework for building the backend.
- **Django REST Framework**: For creating RESTful APIs.
- **PostgreSQL**: A relational database for storing plot data.
- **PostGIS**: A PostgreSQL extension for handling geospatial data (polygons).

### **Map Services**
- **Mapbox**: For rendering interactive maps and providing geocoding services.

---

## **Project Structure**
### **Frontend**
- **`MapComponent.js`**: The main React component that handles map rendering, plot drawing, and interaction.
- **`services/api.js`**: Contains functions for making API calls to the backend (e.g., fetching, saving, updating, and deleting plots).
- **Material-UI Components**: Used for building the sidebar, dialogs, and other UI elements.

### **Backend**
- **Django Models**:
  - `Plot`: A model to store plot data (name, coordinates, area, exploitation, crop type).
- **Django Views**:
  - API views for handling CRUD operations on plots.
- **Django Serializers**:
  - Convert Django model instances to JSON for API responses.

### **Database**
- **PostgreSQL with PostGIS**:
  - Stores plot data, including the polygon geometry.

---

## **How It Works**
### **1. Drawing and Saving Plots**
- The user draws a polygon on the map using the **Mapbox Draw** tool.
- The polygon is validated to ensure it meets the requirements (closed, non-intersecting, etc.).
- The user fills in the plot details (name, crop type) in a dialog.
- The plot is saved to the database via a POST request to the backend.

### **2. Retrieving and Displaying Plots**
- When the application loads, it fetches all saved plots from the database.
- The plots are displayed in a list on the sidebar.
- Clicking a plot in the list zooms the map to fit the entire plot.

### **3. Editing and Deleting Plots**
- The user can edit a plot's details by clicking the edit button next to the plot in the list.
- The updated data is sent to the backend via a PUT request.
- The user can delete a plot by clicking the delete button, which sends a DELETE request to the backend.

### **4. Map Interaction**
- The map is interactive, allowing users to pan, zoom, and draw polygons.
- When a plot is selected, the map automatically zooms to fit the entire plot.

---

## **Key Code Components**
### **Frontend**
1. **Map Rendering**:
   - The map is rendered using **React Map GL** and **Mapbox GL JS**.
   - Mapbox Draw is used to enable drawing and editing polygons.

2. **Plot Validation**:
   - The `validatePolygon` function uses **Turf.js** to validate the polygon geometry.

3. **API Calls**:
   - Functions like `fetchPlots`, `createPlot`, `updatePlot`, and `deletePlot` are defined in `services/api.js` to interact with the backend.

4. **UI Components**:
   - Material-UI components like `Dialog`, `TextField`, `Button`, and `List` are used to build the user interface.

### **Backend**
1. **Django Models**:
   - The `Plot` model stores the plot's name, coordinates (as a PolygonField), area, exploitation, and crop type.

2. **Django Views**:
   - API views handle CRUD operations for plots.

3. **Django Serializers**:
   - Convert the `Plot` model instances to JSON for API responses.

---

## **Setup Instructions**
### **Frontend**
1. Install dependencies:
   ```bash
   npm install react-map-gl mapbox-gl @mapbox/mapbox-gl-draw @mui/material @mui/icons-material axios
   ```
2. Set up environment variables:
   - Create a `.env` file and add your Mapbox access token:
     ```
     REACT_APP_MAPBOX_TOKEN=your_mapbox_token
     ```
3. Start the development server:
   ```bash
   npm start
   ```

### **Backend**
1. Install dependencies:
   ```bash
   pip install django djangorestframework psycopg2-binary django-gis
   ```
2. Set up the database:
   - Install PostgreSQL and PostGIS.
   - Update the `settings.py` file with your database credentials.
3. Run migrations:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```
4. Start the development server:
   ```bash
   python manage.py runserver
   ```

---

## **Future Improvements**
1. **User Authentication**:
   - Add user authentication to allow multiple users to manage their own plots.
2. **Advanced Plot Analysis**:
   - Integrate tools for analyzing plot data (e.g., soil type, weather data).
3. **Export Data**:
   - Allow users to export plot data as GeoJSON or CSV.
4. **Mobile Support**:
   - Optimize the application for mobile devices.

---

## **Conclusion**
This project demonstrates how to build a full-stack web application for managing geospatial data. It combines modern frontend technologies (React, Mapbox) with a robust backend (Django, PostgreSQL) to provide a seamless user experience. The application is highly extensible and can be adapted for various use cases in agriculture, real estate, and more.