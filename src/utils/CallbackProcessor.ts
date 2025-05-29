import { CallbackAction } from '../components/buttons.component';

/**
 * Processes callback query data to determine the intended action.
 */
export class CallbackProcessor {
  private userCallbackData: string;

  constructor(userCallbackData: string) {
    this.userCallbackData = userCallbackData;
  }

  /**
   * Determines the action based on the callback data.
   * @returns The corresponding action string or null if unknown.
   */
  getAction(): string | null {
    if (this.isMenuAction()) {
      return 'menu';
    }

    if (this.isNewUserAction()) {
      return 'new user';
    }

    if (this.myConnectionsMenu()) {
      return 'my connection';
    }

    if (this.openConnection()) {
      return 'open connection';
    }

    if (this.newConnection()) {
      return 'new connection';
    }

    if (this.getReportNow()) {
      return 'report now';
    }

    if (this.editReportProducts()) {
      return 'edit products';
    }

    if (this.off()) {
      return 'off';
    }

    if (this.returnConnection()) {
      return 'return connection menu';
    }

    if (this.getAllReportsNow()) {
      return 'get all reports';
    }

    if (this.changeTime()) {
      return 'change time';
    }

    if (this.changeTitle()) {
      return 'change title';
    }

    if (this.isEditMenuWithImg()) {
      return 'img menu';
    }

    return null;
  }

  private isMenuAction(): boolean {
    return this.userCallbackData.startsWith(CallbackAction.Menu);
  }

  private isNewUserAction(): boolean {
    return this.userCallbackData === CallbackAction.RegistrateUser;
  }

  private myConnectionsMenu(): boolean {
    return this.userCallbackData === CallbackAction.MyConnections;
  }

  private openConnection(): boolean {
    return this.userCallbackData.startsWith(CallbackAction.ConnectionBtn);
  }

  private newConnection(): boolean {
    return this.userCallbackData === CallbackAction.NewConnection;
  }

  private getReportNow(): boolean {
    return this.userCallbackData.startsWith(CallbackAction.GetReportNow);
  }

  private editReportProducts(): boolean {
    return this.userCallbackData.startsWith(CallbackAction.EditReportProducts);
  }

  private off(): boolean {
    return (
      this.userCallbackData.startsWith(CallbackAction.OffConnection) ||
      this.userCallbackData.startsWith(CallbackAction.OffTable)
    );
  }

  private returnConnection(): boolean {
    return this.userCallbackData.startsWith(CallbackAction.ReturnConnection);
  }

  private getAllReportsNow(): boolean {
    return this.userCallbackData === CallbackAction.GetAllReportsNow;
  }

  private changeTime(): boolean {
    return this.userCallbackData.startsWith(CallbackAction.ChangeTime);
  }

  private changeTitle(): boolean {
    return this.userCallbackData.startsWith(CallbackAction.EditConnectionTitle);
  }

  private isEditMenuWithImg(): boolean {
    return this.userCallbackData.startsWith(CallbackAction.MenuEditImg);
  }
}