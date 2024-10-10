# File Explorer

This is a full-stack application for managing files and folders with functionalities similar to an IDE like VS Code. The project consists of a **React frontend** and a **Node.js/Express backend**. Users can create, delete, as well as organize files/folders using a drag-and-drop interface.
rename endpoints are also available in backend.(yet to utilise in frontend) 

## Features 
**Frontend**: 
- Display hierarchical file/folder structure. 
- Create, delete, and move files/folders. 
-  Drag-and-drop functionality for organizing items. 
-  Real-time UI updates for any file/folder action. 

**Backend**: 
- RESTful API for managing file/folder data. 
- Endpoints for creating, updating, deleting, and fetching file/folder structures. 
- Efficiently organizes nested folders and files using parent-child relationships.
-  Supports tree-like traversal and dynamic updates in MongoDB, ensuring hierarchical data consistency.
## Tech Stack 
**Frontend**: 
- React (JavaScript library for UI) 
- Tailwind CSS (Utility-first CSS framework) 
- Axios (For API communication)  

**Backend**: 
- Node.js (JavaScript runtime) 
- Express.js (Backend web framework) 
- MongoDB (NoSQL database for storing hierarchical data) 
- Mongoose (ODM for MongoDB, used for tree structure management)