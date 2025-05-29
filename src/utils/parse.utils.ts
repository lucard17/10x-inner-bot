import { resolve } from 'path';
import { Connection, ConnectionCallbackData, ConnectionStatus } from '../types/connection.types';

/**
 * Resolves the absolute file system path to an image in the public/messageImages directory.
 * Works in both development (src/) and production (dist/) environments.
 * @param imageName - The name of the image file (e.g., 'menu.jpg').
 * @returns The absolute path to the image file (e.g., '/usr/src/app/public/messageImages/menu.jpg').
 */
export function getPath(imageName: string): string {
  // Navigate up from __dirname (src/utils or dist/src/utils) to the project root
  const projectRoot = resolve(__dirname, '../../..'); // Goes up 3 levels: src/utils -> src -> root
  return resolve(projectRoot, 'public/messageImages', imageName);
}

/**
 * Parses connection callback data from a string.
 * @param {string} data - Callback data string.
 * @returns {ConnectionCallbackData} Parsed callback data.
 */
export function parseConnectionData(data: string): ConnectionCallbackData {
  const [action, spreadsheetId, status, additional] = data.split('?');
  return { action, spreadsheetId, status: status as ConnectionStatus, additional };
}

/**
 * Creates a connection callback data string.
 * @param {ConnectionCallbackData} data - Callback data.
 * @returns {string} Formatted callback string.
 */
export function newConnectionData(data: ConnectionCallbackData): string {
  return `${data.spreadsheetId}?${data.status}`;
}

/**
 * Groups connections by spreadsheet ID.
 * @param {Connection[]} connections - List of connections.
 * @returns {Record<string, number[]>} Map of spreadsheet IDs to chat IDs.
 */
export function getFormatConnections(connections: Connection[]): Record<string, number[]> {
  const ssToChatIds = connections.reduce((acc: Record<string, number[]>, row) => {
    acc[row.ss] = acc[row.ss] ? [...acc[row.ss], row.chat_id] : [row.chat_id];
    return acc;
  }, {});
  console.log('Formatted connections:', ssToChatIds);
  return ssToChatIds;
}