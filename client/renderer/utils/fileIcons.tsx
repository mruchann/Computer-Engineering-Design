import { initializeIcons } from '@fluentui/font-icons-mdl2';
import { FontIcon } from '@fluentui/react';

initializeIcons();

export const getFileIcon = (fileName: string, isDirectory: boolean) => {
  if (isDirectory) return <FontIcon iconName="FabricFolder" className="file-icon" />;

  const extension = fileName.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'pdf':
      return <FontIcon iconName="PDF" style={{ fontSize: 24, color: '#D13438' }} />; 
    case 'doc':
    case 'docx':
      return <FontIcon iconName="WordDocument" style={{ fontSize: 24, color: '#2B579A' }} />;
    case 'ppt':
    case 'pptx':
      return <FontIcon iconName="PowerPointDocument" style={{ fontSize: 24, color: '#B7472A' }} />; 
    case 'xls':
    case 'xlsx':
      return <FontIcon iconName="ExcelDocument" style={{ fontSize: 24, color: '#217346' }} />; 
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'bmp':
    case 'svg':
      return <FontIcon iconName="Photo2" style={{ fontSize: 24 }} />;
    case 'mp4':
    case 'avi':
    case 'mov':
    case 'mkv':
      return <FontIcon iconName="Video" style={{ fontSize: 24 }} />;
    case 'mp3':
    case 'wav':
    case 'flac':
      return <FontIcon iconName="MusicInCollection" style={{ fontSize: 24 }} />;
    case 'txt':
      return <FontIcon iconName="TextDocument" style={{ fontSize: 24, color: '#605E5C' }} />; 
    case 'js':
    case 'ts':
    case 'jsx':
    case 'tsx':
    case 'py':
    case 'java':
    case 'c':
    case 'cpp':
    case 'cs':
    case 'php':
    case 'rb':
    case 'swift':
    case 'go':
    case 'rs':
      return <FontIcon iconName="Code" style={{ fontSize: 24, color: '#0078D4' }} />;
    default:
      return <FontIcon iconName="Page" style={{ fontSize: 24, color: '#605E5C' }} />;
  }
};