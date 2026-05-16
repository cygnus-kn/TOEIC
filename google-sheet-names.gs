const TEMPLATE_SPREADSHEET_ID = '1cOwxdWgVMgcolTlZuUvZ6qW1BdxVTC_-OYnPrskuADw';
const DESTINATION_FOLDER_ID = '1op5_PjjLd-guz8rPwbEN5PZ1WNEXFwz8';
const FILE_PREFIX = 'Feedback - ';

const STUDENT_NAMES = [
  'Phạm Thị Yến Nhi',
  'Đinh Thị Phương Dung',
  'Đặng Nguyễn Yến Nhi',
  'Nguyễn Huyền Trang',
  'Hồ Thị Phương Anh',
  'Lê Thị Mỹ Trân',
  'Đỗ Tấn Đạt',
  'Vương Ngọc Phụng',
  'Võ Hồng Gấm',
  'Cao Nguyễn Kỳ Duyên',
  'Phạm Hà Giang',
  'Trần Lê Thuỳ Dương',
  'Phan Thị Thùy Trang',
  'Trương Bảo Ngọc',
  'Nguyễn Chánh Trực',
  'Bùi Nguyễn Thảo Ngân',
  'Phạm Như Mai',
  'Trương Thị Mỹ Thuận',
];

function createFeedbackFilesForStudents() {
  const templateFile = DriveApp.getFileById(TEMPLATE_SPREADSHEET_ID);
  const destinationFolder = DriveApp.getFolderById(DESTINATION_FOLDER_ID);

  STUDENT_NAMES.forEach((studentName) => {
    const fileName = FILE_PREFIX + studentName;

    if (destinationFolder.getFilesByName(fileName).hasNext()) {
      Logger.log('Skipped existing file: ' + fileName);
      return;
    }

    const copiedFile = templateFile.makeCopy(fileName, destinationFolder);

    Logger.log('Created: ' + fileName + ' - ' + copiedFile.getUrl());
  });
}
