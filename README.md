# Free-Dida (Simplified TickTick)

[中文文档](./README.zh-CN.md)

Free-Dida is a lightweight, Local-First personal task management application (PWA). It aims to provide a minimalist yet efficient task management experience, combining the intuitiveness of Kanban with the continuity of a timeline.

## ✨ Core Features

- **📅 Infinite Calendar Kanban**: A unique horizontal scrolling calendar view that seamlessly blends Kanban with a timeline.
- **⚡️ Extreme Performance**: Based on Local-First architecture, all operations are completed in memory, with instant response and offline availability.
- **🧠 Natural Language Parsing**: Supports smart input (e.g., "Meeting tomorrow at 3 PM !p0"), automatically recognizing time and priority.
- **🎨 Modern UI**: Built with Tailwind CSS, the interface is clean and beautiful, supporting dark mode (planned).
- **📱 PWA Support**: Can be installed on desktop or mobile, providing a native-like app experience.

## 🛠 Tech Stack

- **Frontend Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + clsx + tailwind-merge
- **State Management**: Zustand
- **Persistence**: IndexedDB (idb-keyval)
- **Drag & Drop**: @dnd-kit
- **Icons**: Lucide React
- **Date Handling**: date-fns

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18
- npm or yarn

### Installation & Running

1.  **Clone the repository**

    ```bash
    git clone https://github.com/your-username/free-dida.git
    cd free-dida
    ```

2.  **Install dependencies**

    ```bash
    npm install
    ```

3.  **Start development server**

    ```bash
    npm run dev
    ```

    Open your browser and visit `http://localhost:5173` to see the application.

4.  **Build for production**

    ```bash
    npm run build
    ```

## 📂 Project Structure

```
free-dida/
├── docs/               # Project documentation (requirements, design)
├── src/
│   ├── components/     # UI components
│   ├── store/          # Zustand state management
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions (NLP, date handling, etc.)
│   ├── App.tsx         # App root component
│   └── main.tsx        # Entry file
├── index.html          # HTML template
├── tailwind.config.js  # Tailwind configuration
├── tsconfig.json       # TypeScript configuration
└── vite.config.ts      # Vite configuration
```

## 🤝 Contributing

Issues and Pull Requests are welcome!

## 📄 License

MIT License
