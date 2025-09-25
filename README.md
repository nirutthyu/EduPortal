# Zenith - A smart E-Learning website

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

# Data Scraping
- Based on your chosen domain a road map will be generated with help of gemini-pro model.
- The road map topic is passed as a query to youtube data api.
- It fetches 10 videos for all the topics, among those 10 videos, the video with more like count will be appended with topic, url and transcript to the json file.
- The json file is used for displaying the videos and also in all the features.

# Features
**Summary** - With the help of the generated transcript, summarization has been provided using gemini-pro.

**doubts**  - Considering the age and transcript as input to the gemini pro model making doubt clarification an enjoyable feature to the people of any age group.

**quiz**    - A quiz will be generated with the help of the transcripts and the user will be able to choose the answers and keep track of their scores.

![image](https://github.com/user-attachments/assets/a3ba338a-06e3-41a3-b83e-c17530e73451)
![image](https://github.com/user-attachments/assets/88ecc82b-bb68-4c11-be36-82f409ba3e4b)
![image](https://github.com/user-attachments/assets/4eb86e27-8c6f-4592-9219-d65f8620a602)
![image](https://github.com/user-attachments/assets/16613042-34af-40ba-909f-d52a92ee3678)
![image](https://github.com/user-attachments/assets/95fe991f-9512-4271-b5f3-71b2618e2d8e)
