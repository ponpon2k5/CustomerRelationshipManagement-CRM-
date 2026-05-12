# Standard project structure (Spring Boot + React)

## Backend (`backend/`)

```
backend/
└─ src/
   ├─ main/
   │  ├─ java/com/scrum/crm/
   │  │  ├─ common/
   │  │  │  ├─ constants/
   │  │  │  └─ util/
   │  │  ├─ config/
   │  │  ├─ controller/
   │  │  ├─ dto/
   │  │  │  ├─ request/
   │  │  │  └─ response/
   │  │  ├─ entity/
   │  │  ├─ exception/
   │  │  ├─ mapper/
   │  │  ├─ repository/
   │  │  ├─ security/
   │  │  ├─ service/
   │  │  └─ CrmApplication.java
   │  └─ resources/
   │     ├─ db/
   │     │  ├─ migration/
   │     │  └─ seed/
   │     ├─ messages/
   │     ├─ application.properties
   │     ├─ application-dev.properties
   │     └─ application-prod.properties
   └─ test/
      └─ java/com/scrum/crm/
         ├─ integration/
         └─ unit/
```

## Frontend (`frontend/`)

```
frontend/
└─ src/
   ├─ app/
   │  ├─ App.jsx
   │  └─ App.css
   ├─ assets/
   │  ├─ icons/
   │  └─ images/
   ├─ components/
   │  ├─ common/
   │  └─ layout/
   ├─ constants/
   ├─ features/
   ├─ hooks/
   ├─ layouts/
   ├─ pages/
   ├─ routes/
   ├─ services/
   │  ├─ api/
   │  └─ http/
   ├─ store/
   ├─ styles/
   │  └─ index.css
   ├─ utils/
   └─ main.jsx
```
