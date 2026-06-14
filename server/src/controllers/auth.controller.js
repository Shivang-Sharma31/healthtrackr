import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const registerUser = asyncHandler(async (req,res) => {
    
})

const loginUser = asyncHandler(async (req,res) => {

})

const logoutUser = asyncHandler(async (req,res) => {

})


const refreshAccessToken = asyncHandler(async(req,res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken ;
    if(!incomingRefreshToken) {
        throw new ApiError (401 , "Refresh token required");
    }

    try {
        jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
        const user = await User.findById(decodedToken?._id);
        if(!user) throw new ApiError (404 , "Invalid Refresh token");

        if(incomingRefreshToken !== user?.refreshToken ){
            throw new ApiError (401 , "Invalid Refresh token");
        }

        const options = {
            httpOnly :true,
            secure : process.env.NODE_ENV === "production",
        }
        const {accessToken , refreshToken : newRefreshToken} = await generateAcessAndRefreshToken (user._id);
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(new ApiResponse(200, {accessToken,refreshToken:newRefreshToken}," access token refreshed successfully :)"));


    } catch (error) {
        throw new ApiError (500, "something went wrong while refreshing access token");
    }

})

export { registerUser,loginUser,logoutUser,refreshAccessToken };