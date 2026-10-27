import { render } from 'preact';
import { Popup } from './Popup';
import './tokens.css';
import './styles.css';

render(<Popup />, document.getElementById('app') as HTMLElement);
