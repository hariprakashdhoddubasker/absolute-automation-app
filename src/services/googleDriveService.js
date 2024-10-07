// src/services/googleDriveService.js
const googleDriveIntegration = require('../integrations/googleDriveIntegration');
const moment = require('moment');
const tokenRepository = require('../repositories/tokenRepository');
const whatsappMessagingService = require('../services/whatsappMessagingService');
const { handleError } = require('../utils/responseHelpers');
const logger = require('../utils/logger');

const googleDriveService = {
  initiateAuthFlow: async () => {
    try {
      return await googleDriveIntegration.getAuthUrl();
    } catch (error) {
      handleError('[initiateAuthFlow] Failed to initiate Google Drive Auth Flow', error);
      return null;
    }
  },

  authenticateAndStoreTokens: async (code) => {
    try {
      // Obtain tokens and store them securely
      const authClient = await googleDriveIntegration.getGoogleDriveClient(
        code
      );
      const userInfo = await googleDriveIntegration.getUserInfo(authClient);
      const userId = userInfo.id;
      const userName = userInfo.name;
      await tokenRepository.storeTokens(
        userId,
        userName,
        authClient.credentials,
        'Google Drive'
      );
      return { userId };
    } catch (error) {
      handleError(
        '[authenticateAndStoreTokens] Failed to authenticate and store Google Drive tokens',
        error
      );
      return null;
    }
  },

  generateDailyReportService: async (userId, folderId) => {
    try {
      // Retrieve tokens from the database
      const token = await tokenRepository.getTokens(userId, 'Google Drive');

      if (!token) {
        let message = `*[DailyReportService]* No Google tokens found for user ID ${userId}. Please authenticate the user first.`;
        await whatsappMessagingService.sendMessageToManagement(message);
        return `No tokens found for user ID ${userId}. Please authenticate the user first.`;
      }
      const authClient = await googleDriveIntegration.getAuthenticatedClient(
        token
      );

      // Refresh token if expired
      if (!token.refresh_token) {
        let message = 'No refresh token is set.';
        await whatsappMessagingService.sendMessageToManagement(message);
        return message;
      }

      // Fetch files from Google Drive
      const files = await googleDriveIntegration.fetchFilesFromFolder(
        authClient,
        folderId
      );

      // Filter files created today
      const today = moment().startOf('day');
      const callFiles = googleDriveService.filterFilesByDate(files, today);

      // Filter files older than one week and delete them
      const filesOlderThanOneWeek =
        googleDriveService.filterFilesOlderThanOneWeek(files);

      const deletedFilesByDate = await googleDriveService.deleteOldFiles(
        filesOlderThanOneWeek,
        authClient
      );

      const report = googleDriveService.generateDailyCallReport(
        callFiles.length,
        deletedFilesByDate
      );

      // Send the report via WhatsApp in the production env
      process.env.NODE_ENV === 'production'
        ? await whatsappMessagingService.sendMessageToManagement(report, true)
        : logger.info(report);

      return true;
    } catch (error) {
      handleError(`[generateDailyReportService] Failed to generate daily report`, error);
      return null;
    }
  },

  extractDetailsFromFileName: (fileName) => {
    try {
      // Use regex to extract phone number (with or without +91) or string name, date, and time
      const match = fileName.match(
        /Call recording (.+?)_(\d{6})_(\d{6})\.m4a$/
      );

      if (match) {
        const phoneOrName = match[1]; // Extract phone number or caller name
        const dateStr = match[2]; // Extract the date part (YYMMDD)
        const timeStr = match[3]; // Extract the time part (HHMMSS)

        // Determine if the extracted value is a phone number or a name
        const isPhoneNumber = /^\+?\d+$/.test(phoneOrName); // Check if it's a phone number (with optional '+' prefix)
        const callerIdentifier = isPhoneNumber
          ? phoneOrName.replace(/^\+91/, '')
          : phoneOrName; // Remove +91 if present

        // Parse the date and time
        const date = moment(dateStr, 'YYMMDD').format('YYYY-MM-DD'); // Convert to a readable date format
        const time = moment(timeStr, 'HHmmss').format('HH:mm:ss'); // Convert to a readable time format

        return {
          callerIdentifier, // Will be either phone number or caller name
          date,
          time,
        };
      }

      return null; // Return null if the file name doesn't match the pattern
    } catch (error) {
      handleError('[extractDetailsFromFileName] Failed to extract details from file name', error);
      return null;
    }
  },

  // Filter files by date and extract details
  filterFilesByDate: (files, targetDate) => {
    try {
      return files.filter((file) => {
        const details = googleDriveService.extractDetailsFromFileName(
          file.name
        );

        if (details) {
          const fileDate = moment(details.date, 'YYYY-MM-DD');
          return fileDate.isSame(targetDate, 'day');
        }

        return false;
      });
    } catch (error) {
      handleError('[filterFilesByDate] Failed to filter files older than one week', error);
      return null;
    }
  },

  // Helper function to generate the report
  generateDailyCallReport: (uniqueCallerCount, deletedFilesByDate) => {
    try {
      let deletionReport = '';

      // Format the deletion report
      for (const [date, count] of Object.entries(deletedFilesByDate)) {
        deletionReport += `${date} : ${count}\n`;
      }

      //return `\nDaily Call Report:\nCalled Numbers: ${uniqueCallerCount}\n\nFile Deletion Report:\n${deletionReport.trim()}`;
      return `\nDaily Call Report:\nCalled Numbers : ${uniqueCallerCount}${
        deletionReport.trim() ? `\n\nFile Deletion Report : \n${deletionReport.trim()}` : ''
      }`;
    } catch (error) {
      handleError(
        '[generateDailyCallReport] Failed to generate daily call report',
        error
      );
      return null;
    }
  },

  // Updated filterFilesOlderThanOneMonth using extractDetailsFromFileName
  filterFilesOlderThanOneWeek: (files) => {
    try {
      return files.filter((file) => {
        const details = googleDriveService.extractDetailsFromFileName(
          file.name
        ); // Reuse the extraction function

        if (details) {
          const fileDate = moment(details.date, 'YYYY-MM-DD'); // Convert extracted date to moment object

          // Check if the file date is before one week ago
          return fileDate.isBefore(moment().subtract(1, 'weeks'));
        }
        return false; // Return false if details could not be extracted
      });
    } catch (error) {
      handleError(
        '[filterFilesOlderThanOneWeek] filter files that are older than one week',
        error
      );
      return null;
    }
  },

  deleteOldFiles: async (filesOlderThanOneWeek, authClient) => {
    const deletedFilesByDate = {}; // Object to store counts of deleted files by date
    try {
      for (const file of filesOlderThanOneWeek) {
        const details = googleDriveService.extractDetailsFromFileName(
          file.name
        ); // Extract details including the date
        if (details) {
          const fileCreationDate = details.date; // Extract the creation date from file details

          const isDeleted = await googleDriveIntegration.deleteFileFromDrive(
            file.id,
            authClient
          );

          if (isDeleted) {
            // Use the extracted file creation date for grouping deletions
            deletedFilesByDate[fileCreationDate] =
              (deletedFilesByDate[fileCreationDate] || 0) + 1; // Increment count for this date
          }
        } else {
          console.warn(
            `Could not extract details from file name: ${file.name}`
          );
        }
      }
      return deletedFilesByDate;
    } catch (error) {
      handleError('[deleteOldFiles]Failed to delete old files', error);
      return null;
    }
  },
};
module.exports = googleDriveService;
