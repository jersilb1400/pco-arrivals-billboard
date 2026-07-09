<%@ Control Language="C#" AutoEventWireup="true"
    CodeFile="ArrivalsAdmin.ascx.cs"
    Inherits="com.gracefellowship.Arrivals.Blocks.ArrivalsAdmin" %>

<%@ Register Namespace="Rock.Web.UI.Controls" Assembly="Rock" TagPrefix="Rock" %>

<asp:UpdatePanel ID="upMain" runat="server" UpdateMode="Conditional">
    <ContentTemplate>

        <!-- ─── Active session banner (shown when a billboard is live) ─── -->
        <asp:Panel ID="pnlActiveSession" runat="server" Visible="false" CssClass="panel panel-block">
            <div class="panel-heading">
                <h1 class="panel-title">
                    <i class="fa fa-circle" style="color: #5cb85c;"></i>&nbsp;Active Billboard Session
                </h1>
            </div>
            <div class="panel-body">
                <div class="row">
                    <div class="col-md-8">
                        <h3><asp:Literal ID="litActiveGroupType" runat="server" /></h3>
                        <p class="text-muted">
                            <asp:Literal ID="litActiveDate" runat="server" />
                            &nbsp;&middot;&nbsp;
                            <asp:Literal ID="litActiveStartedBy" runat="server" />
                        </p>
                    </div>
                    <div class="col-md-4 text-right">
                        <asp:HyperLink ID="hlBillboard" runat="server" CssClass="btn btn-default" Target="_blank">
                            <i class="fa fa-tv"></i>&nbsp;Open Billboard
                        </asp:HyperLink>
                        <asp:LinkButton ID="lbClearSession" runat="server" CssClass="btn btn-warning margin-l-sm"
                            OnClick="lbClearSession_Click"
                            OnClientClick="return confirm('Clear the active billboard session? This removes all children currently shown on the pickup billboard.')">
                            <i class="fa fa-times"></i>&nbsp;Clear Session
                        </asp:LinkButton>
                    </div>
                </div>
            </div>
        </asp:Panel>

        <!-- ─── Configuration panel (pick date + check-in area → launch) ─── -->
        <asp:Panel ID="pnlConfig" runat="server" CssClass="panel panel-block">
            <div class="panel-heading">
                <h1 class="panel-title">
                    <i class="fa fa-child"></i>&nbsp;<asp:Literal ID="litPanelTitle" runat="server" Text="Start a Billboard Session" />
                </h1>
            </div>
            <div class="panel-body">

                <Rock:NotificationBox ID="nbMessage" runat="server" Visible="false" />

                <div class="row">
                    <div class="col-md-4">
                        <Rock:DatePicker ID="dpDate" runat="server" Label="Service Date"
                            Help="The date of the service/check-in event. Security codes recycle daily, so this must match the day children are checked in." Required="true" />
                    </div>
                    <div class="col-md-5">
                        <Rock:RockDropDownList ID="ddlGroupType" runat="server" Label="Check-in Area"
                            Help="The Rock GroupType (check-in area) for this service — e.g. 'Weekend Kids'. Populated from your Rock Check-in configuration." Required="true" />
                    </div>
                    <div class="col-md-3">
                        <div class="form-group">
                            <label class="control-label">&nbsp;</label>
                            <div>
                                <asp:LinkButton ID="lbLaunch" runat="server" CssClass="btn btn-primary btn-block"
                                    OnClick="lbLaunch_Click">
                                    <i class="fa fa-play"></i>&nbsp;Launch Billboard
                                </asp:LinkButton>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </asp:Panel>

        <!-- ─── Quick links ─── -->
        <div class="row margin-t-md">
            <div class="col-md-12">
                <asp:HyperLink ID="hlKiosk" runat="server" CssClass="btn btn-default" Target="_blank">
                    <i class="fa fa-qrcode"></i>&nbsp;Open Kiosk
                </asp:HyperLink>
                <asp:HyperLink ID="hlLocationStatus" runat="server" CssClass="btn btn-default margin-l-sm" Target="_blank">
                    <i class="fa fa-building"></i>&nbsp;Open Location Status
                </asp:HyperLink>
            </div>
        </div>

    </ContentTemplate>
</asp:UpdatePanel>
